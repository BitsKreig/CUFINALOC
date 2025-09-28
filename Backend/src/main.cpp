#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <stdexcept>
#include <algorithm>
#include <sstream>
#include <fstream>
#include <unordered_set>
#include <random>
#include <array>
#include <map>
#include "simple_scheduler.hpp"
using namespace std;
using namespace sched;

// ---------- JSON helpers ----------
static string json_escape(const string &s)
{
  string o;
  o.reserve(s.size() + 16);
  for (unsigned char c : s)
  {
    switch (c)
    {
    case '\"':
      o += "\\\"";
      break;
    case '\\':
      o += "\\\\";
      break;
    case '\b':
      o += "\\b";
      break;
    case '\f':
      o += "\\f";
      break;
    case '\n':
      o += "\\n";
      break;
    case '\r':
      o += "\\r";
      break;
    case '\t':
      o += "\\t";
      break;
    default:
      if (c < 0x20)
      {
        char buf[7];
        snprintf(buf, sizeof(buf), "\\u%04x", c);
        o += buf;
      }
      else
      {
        o += char(c);
      }
    }
  }
  return o;
}

// Serialize a section's timetable into a string (used to check uniqueness)
static string serialize_section(const SectionPlan &sp, int P)
{
  string s;
  for (int d = 0; d < 5; ++d)
  {
    for (int p = 0; p < P; ++p)
    {
      s += sp.plan.table[d][p] + "|";
    }
  }
  return s;
}

static const char *DAY_NAME[5] = {"Mon", "Tue", "Wed", "Thu", "Fri"};

// ---------- Scoring (lower is better) ----------
static double score_output(const Output &o)
{
  int adj_dups = 0, gaps = 0;
  array<int, 5> day_load{0, 0, 0, 0, 0};

  for (const auto &sec : o.sections)
  {
    for (int d = 0; d < 5; ++d)
    {
      const auto &row = sec.plan.table[d];
      string prev;
      for (int p = 0; p < o.P; ++p)
      {
        const auto &cell = row[p];
        if (cell.empty() || cell == "-")
        {
          gaps++;
          continue;
        }
        day_load[d]++;
        if (!prev.empty() && prev == cell)
          adj_dups++;
        prev = cell;
      }
    }
  }
  double sum = 0.0;
  for (int v : day_load)
    sum += v;
  double avg = sum / 5.0;
  double var = 0.0;
  for (int v : day_load)
  {
    double dv = v - avg;
    var += dv * dv;
  }
  var /= 5.0;

  return 10.0 * adj_dups + 1.0 * gaps + 5.0 * var;
}

// ---------- JSON writer for phases ----------
struct Cand
{
  Output out;
  double score;
  string phaseName;
  string phaseDesc;
};

static void write_json_phases_to_stream(
    const vector<Cand> &all,
    const InputData &in,
    ostream &os)
{
  map<string, vector<const Cand *>> byPhase;
  for (const auto &c : all)
    byPhase[c.phaseName].push_back(&c);

  os << "{\n";
  os << "  \"meta\": {\n";
  os << "    \"department\": \"" << json_escape(in.dept) << "\",\n";
  os << "    \"semester\": " << in.semester << ",\n";
  os << "    \"batches\": " << in.batches << ",\n";
  os << "    \"periods_per_day\": " << (all.empty() ? in.periods_per_day : all.front().out.P) << ",\n";
  os << "    \"days\": [\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\"]\n";
  os << "  },\n";
  os << "  \"phases\": [\n";

  size_t pcnt = 0;
  for (auto &kv : byPhase)
  {
    const string &pname = kv.first;
    const auto &vec = kv.second;

    os << "    {\n";
    os << "      \"name\": \"" << json_escape(pname) << "\",\n";
    string pdesc = vec.empty() ? "" : vec[0]->phaseDesc;
    os << "      \"desc\": \"" << json_escape(pdesc) << "\",\n";
    os << "      \"options\": [\n";

    for (size_t i = 0; i < vec.size(); ++i)
    {
      const auto &C = *vec[i];
      os << "        {\n";
      os << "          \"score\": " << C.score << ",\n";

      os << "          \"weekly_counts\": [";
      for (size_t j = 0; j < C.out.weekly_counts.size(); ++j)
      {
        if (j)
          os << ", ";
        os << "{\"subject\":\"" << json_escape(C.out.weekly_counts[j].first)
          << "\",\"weekly\":" << C.out.weekly_counts[j].second << "}";
      }
      os << "],\n";

      os << "          \"sections\": [\n";
      for (size_t sidx = 0; sidx < C.out.sections.size(); ++sidx)
      {
        const auto &sp = C.out.sections[sidx];
        os << "            {\n";
        os << "              \"section\": \"" << json_escape(sp.section) << "\",\n";
        os << "              \"table\": {\n";
        for (int d = 0; d < 5; ++d)
        {
          os << "                \"" << DAY_NAME[d] << "\": [";
          for (int p = 0; p < sp.plan.P; ++p)
          {
            if (p)
              os << ", ";
            string cell = sp.plan.table[d][p];
            if (cell == "-" || cell.empty())
              cell.clear();
            os << "\"" << json_escape(cell) << "\"";
          }
          os << "]" << (d == 4 ? "\n" : ",\n");
        }
        os << "              }\n";
        os << "            }" << (sidx + 1 == C.out.sections.size() ? "\n" : ",\n");
      }
      os << "          ]\n";
      os << "        }" << (i + 1 == vec.size() ? "\n" : ",\n");
    }

    os << "      ]\n";
    os << "    }" << (++pcnt == byPhase.size() ? "\n" : ",\n");
  }

  os << "  ]\n";
  os << "}\n";
}

// ---------- JSON parsing ----------
struct InputDataJSON {
  string dept;
  int semester;
  int batches;
  string start_date;
  string end_date;
  int periods_per_day;
  int min_classes_per_day;
  int max_classes_per_day;
  vector<Subject> subs;
};

InputDataJSON parse_input_json(const string& json_str) {
  InputDataJSON input;
  // Parse JSON manually using string operations
  // Expected format: extend with periods_per_day, min_classes_per_day, max_classes_per_day

  // Extract values using string find
  size_t pos = 0;

  // batches
  pos = json_str.find("\"batches\":", pos);
  if (pos != string::npos) {
    // Skip to after ":"
    pos += 10;
    // Skip whitespace
    while (pos < json_str.length() && isspace(json_str[pos])) pos++;
    size_t end = json_str.find_first_of(",}", pos);
    if (end != string::npos) {
      string val_str = json_str.substr(pos, end - pos);
      // Trim whitespace from val_str
      size_t start = val_str.find_first_not_of(" \t\n\r");
      if (start != string::npos) {
        size_t len = val_str.find_last_not_of(" \t\n\r") - start + 1;
        val_str = val_str.substr(start, len);
      }
      input.batches = stoi(val_str);
    }
  } else {
    input.batches = 3; // default
  }

  // department
  pos = json_str.find("\"department\"", pos);
  if (pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", pos + 11); // after "department"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t val_start = colon_pos + 1;
      while (val_start < json_str.length() && isspace(json_str[val_start])) val_start++;
      if (json_str[val_start] == '"') {
        val_start++; // skip opening quote
        size_t val_end = json_str.find("\"", val_start);
        if (val_end != string::npos) {
          input.dept = json_str.substr(val_start, val_end - val_start);
        }
      }
    }
  } else {
    input.dept = "CSE"; // default
  }

  // semester
  pos = json_str.find("\"semester\"", pos);
  if (pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", pos + 10); // after "semester"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t val_start = colon_pos + 1;
      while (val_start < json_str.length() && isspace(json_str[val_start])) val_start++;
      size_t val_end = json_str.find_first_of(",}", val_start);
      if (val_end != string::npos) {
        string val_str = json_str.substr(val_start, val_end - val_start);
        // Trim whitespace
        size_t start = val_str.find_first_not_of(" \t\n\r");
        if (start != string::npos) {
          size_t len = val_str.find_last_not_of(" \t\n\r") - start + 1;
          val_str = val_str.substr(start, len);
        }
        input.semester = stoi(val_str);
      }
    }
  } else {
    input.semester = 5; // default
  }

  // semesterStart
  pos = json_str.find("\"semesterStart\"", pos);
  if (pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", pos + 14); // after "semesterStart"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t val_start = colon_pos + 1;
      while (val_start < json_str.length() && isspace(json_str[val_start])) val_start++;
      if (json_str[val_start] == '"') {
        val_start++; // skip opening quote
        size_t val_end = json_str.find("\"", val_start);
        if (val_end != string::npos) {
          input.start_date = json_str.substr(val_start, val_end - val_start);
        }
      }
    }
  } else {
    input.start_date = "2025-07-15"; // default
  }

  // semesterEnd
  pos = json_str.find("\"semesterEnd\"", pos);
  if (pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", pos + 12); // after "semesterEnd"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t val_start = colon_pos + 1;
      while (val_start < json_str.length() && isspace(json_str[val_start])) val_start++;
      if (json_str[val_start] == '"') {
        val_start++; // skip opening quote
        size_t val_end = json_str.find("\"", val_start);
        if (val_end != string::npos) {
          input.end_date = json_str.substr(val_start, val_end - val_start);
        }
      }
    }
  } else {
    input.end_date = "2025-12-05"; // default
  }

  // periods_per_day
  pos = json_str.find("\"periods_per_day\"", pos);
  if (pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", pos + 16); // after "periods_per_day"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t val_start = colon_pos + 1;
      while (val_start < json_str.length() && isspace(json_str[val_start])) val_start++;
      size_t val_end = json_str.find_first_of(",}", val_start);
      if (val_end != string::npos) {
        string val_str = json_str.substr(val_start, val_end - val_start);
        // Trim whitespace
        size_t start = val_str.find_first_not_of(" \t\n\r");
        if (start != string::npos) {
          size_t len = val_str.find_last_not_of(" \t\n\r") - start + 1;
          val_str = val_str.substr(start, len);
        }
        input.periods_per_day = stoi(val_str);
      }
    }
  } else {
    input.periods_per_day = 6; // default
  }

  // min_classes_per_day
  pos = json_str.find("\"min_classes_per_day\"", pos);
  if (pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", pos + 20); // after "min_classes_per_day"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t val_start = colon_pos + 1;
      while (val_start < json_str.length() && isspace(json_str[val_start])) val_start++;
      size_t val_end = json_str.find_first_of(",}", val_start);
      if (val_end != string::npos) {
        string val_str = json_str.substr(val_start, val_end - val_start);
        // Trim whitespace
        size_t start = val_str.find_first_not_of(" \t\n\r");
        if (start != string::npos) {
          size_t len = val_str.find_last_not_of(" \t\n\r") - start + 1;
          val_str = val_str.substr(start, len);
        }
        input.min_classes_per_day = stoi(val_str);
      }
    }
  } else {
    input.min_classes_per_day = max(0, input.periods_per_day - 3); // default
  }

  // max_classes_per_day
  pos = json_str.find("\"max_classes_per_day\"", pos);
  if (pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", pos + 20); // after "max_classes_per_day"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t val_start = colon_pos + 1;
      while (val_start < json_str.length() && isspace(json_str[val_start])) val_start++;
      size_t val_end = json_str.find_first_of(",}", val_start);
      if (val_end != string::npos) {
        string val_str = json_str.substr(val_start, val_end - val_start);
        // Trim whitespace
        size_t start = val_str.find_first_not_of(" \t\n\r");
        if (start != string::npos) {
          size_t len = val_str.find_last_not_of(" \t\n\r") - start + 1;
          val_str = val_str.substr(start, len);
        }
        input.max_classes_per_day = stoi(val_str);
      }
    }
  } else {
    input.max_classes_per_day = input.periods_per_day - 1; // default
  }

  // subjects - improved parsing that handles both objects and strings
  size_t subjects_pos = json_str.find("\"subjects\"");
  if (subjects_pos != string::npos) {
    // Find the colon after key
    size_t colon_pos = json_str.find(":", subjects_pos + 9); // after "subjects"
    if (colon_pos != string::npos) {
      // Skip whitespace after colon
      size_t array_start = colon_pos + 1;
      while (array_start < json_str.length() && isspace(json_str[array_start])) array_start++;
      if (json_str[array_start] == '[') {
        array_start++; // skip [
        size_t array_end = json_str.find("]", array_start);
        if (array_end != string::npos) {
          // Extract the entire subjects array content
          string subjects_content = json_str.substr(array_start, array_end - array_start);

          // First try to parse as objects with name and credits
          size_t obj_start = 0;
          while ((obj_start = subjects_content.find("{", obj_start)) != string::npos) {
            size_t obj_end = subjects_content.find("}", obj_start);
            if (obj_end == string::npos) break;

            string subject_obj = subjects_content.substr(obj_start, obj_end - obj_start + 1);

            // Extract name - try both quoted and unquoted formats
            string name;
            size_t name_pos = subject_obj.find("\"name\"", 0);
            if (name_pos != string::npos) {
              // Find colon after "name"
              size_t name_colon = subject_obj.find(":", name_pos + 6);
              if (name_colon != string::npos) {
                size_t name_val_start = name_colon + 1;
                while (name_val_start < subject_obj.length() && isspace(subject_obj[name_val_start])) name_val_start++;
                if (subject_obj[name_val_start] == '"') {
                  name_val_start++; // skip quote
                  size_t name_end = subject_obj.find("\"", name_val_start);
                  if (name_end != string::npos) {
                    name = subject_obj.substr(name_val_start, name_end - name_val_start);
                  }
                }
              }
            }

            if (!name.empty()) {

              // Extract credits - try both quoted and unquoted formats
              int credits = 1; // default
              size_t credits_pos = subject_obj.find("\"credits\"", 0);
              if (credits_pos != string::npos) {
                // Find colon after "credits"
                size_t credits_colon = subject_obj.find(":", credits_pos + 9);
                if (credits_colon != string::npos) {
                  size_t credits_val_start = credits_colon + 1;
                  while (credits_val_start < subject_obj.length() && isspace(subject_obj[credits_val_start])) credits_val_start++;
                  size_t credits_end = subject_obj.find_first_of(",}", credits_val_start);
                  if (credits_end != string::npos) {
                    string credits_str = subject_obj.substr(credits_val_start, credits_end - credits_val_start);
                    // Trim whitespace
                    size_t c_start = credits_str.find_first_not_of(" \t\n\r");
                    if (c_start != string::npos) {
                      size_t c_len = credits_str.find_last_not_of(" \t\n\r") - c_start + 1;
                      credits_str = credits_str.substr(c_start, c_len);
                    }
                    // Extract digits
                    string digits_only;
                    for (char c : credits_str) {
                      if (isdigit(c)) {
                        digits_only += c;
                      }
                    }
                    if (!digits_only.empty()) {
                      try {
                        credits = stoi(digits_only);
                      } catch (...) {
                        credits = 1;
                      }
                    }
                  }
                }
              }

              input.subs.push_back(Subject{name, credits});
            }

            obj_start = obj_end + 1; // Move to next object
          }

          // If no objects found, try to parse as simple strings
          if (input.subs.empty()) {
            size_t item_start = 0;
            while ((item_start = subjects_content.find("\"", item_start)) != string::npos) {
              size_t item_end = subjects_content.find("\"", item_start + 1);
              if (item_end == string::npos) break;

              string subject_name = subjects_content.substr(item_start + 1, item_end - item_start - 1);
              // Skip if it's a key like "name"
              if (!subject_name.empty() && subject_name.find_first_of(" \t\n\r") == string::npos && subject_name != "name" && subject_name != "credits") {
                input.subs.push_back(Subject{subject_name, 1}); // Default credits = 1
              }

              item_start = item_end + 1; // Move to next item
            }
          }
        }
      }
    }
  }



  // Only use defaults if no subjects were parsed
  if (input.subs.empty()) {
    input.subs = {Subject{"Math",4}, Subject{"DS",3}, Subject{"OS",3}, Subject{"DBMS",4}, Subject{"EVS",2}}; // default
  }

  return input;
}

static string read_stdin_all() {
  stringstream ss;
  ss << cin.rdbuf();
  string result = ss.str();
  // Debug: print the input JSON (to stderr so it doesn't interfere with JSON output)
  cerr << "DEBUG: Input JSON: " << result << endl;
  return result;
}

// ---------- Main ----------
int main()
{
  ios::sync_with_stdio(false);
  cin.tie(&cout);

  string input_json = read_stdin_all();

  // Parse input JSON
  InputDataJSON input_data_json = parse_input_json(input_json);

  // Map InputDataJSON to InputData
  InputData in;
  in.dept = input_data_json.dept;
  in.semester = input_data_json.semester;
  in.batches = input_data_json.batches;
  in.start_date = input_data_json.start_date;
  in.end_date = input_data_json.end_date;
  in.periods_per_day = input_data_json.periods_per_day;
  in.min_classes_per_day = input_data_json.min_classes_per_day;
  in.max_classes_per_day = input_data_json.max_classes_per_day;
  in.subs = input_data_json.subs;

  // --- Phase policies ---
  auto clampRange = [&](int lo, int hi)
  {
    lo = max(0, min(lo, in.periods_per_day));
    hi = max(lo, min(hi, in.periods_per_day));
    return pair<int, int>{lo, hi};
  };
  pair<int, int> p1 = clampRange(6, 8);
  pair<int, int> p2 = clampRange(4, 5);
  pair<int, int> p3 = clampRange(2, 3);

  struct Phase
  {
    string name, desc;
    int lo, hi;
  };
  vector<Phase> phases = {
      {"phase1", "Beginning of semester: strict, credit-heavy, 6-8 classes/day", p1.first, p1.second},
      {"phase2", "Mid semester: stress-light for events, 4-5 classes/day", p2.first, p2.second},
      {"phase3", "End semester: revision & prep, 2-3 classes/day", p3.first, p3.second}};

  // Always generate 6 candidates, keep best 3 unique per phase

  int num_opts = 6;
  int keep_top = 3;

  vector<Cand> all;
  all.reserve(keep_top * phases.size());

  std::mt19937 rng(std::random_device{}()); // strong random seed

  for (const auto &ph : phases)
  {
    InputData pin = in;
    pin.min_classes_per_day = ph.lo;
    pin.max_classes_per_day = ph.hi;

    vector<pair<double, Output>> pool;
    pool.reserve(num_opts);
    unordered_set<string> seen; // ensure unique timetables

    int attempts = 0;
    while ((int)pool.size() < num_opts && attempts < num_opts * 20)
    {
      attempts++;
      Output out = build_schedule(pin);

      // serialize first section (for uniqueness check)
      string sig = serialize_section(out.sections.front(), out.P);
      if (seen.count(sig))
        continue; // skip duplicates
      seen.insert(sig);

      double sc = score_output(out);
      pool.push_back({sc, std::move(out)});
    }

    // sort by score and keep top-K
    sort(pool.begin(), pool.end(), [](auto &a, auto &b)
         { return a.first < b.first; });
    pool.resize(min<int>(keep_top, pool.size()));

    for (auto &pr : pool)
    {
      all.push_back({std::move(pr.second), pr.first, ph.name, ph.desc});
    }
  }

  // --- Write JSON to stdout ---
  write_json_phases_to_stream(all, in, cout);

  return 0;
}
