#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <stdexcept>
#include <iomanip>
#include <algorithm>
#include "simple_scheduler.hpp"
using namespace std;
using namespace sched;

// Ensure derive_plan is declared and defined in simple_scheduler.hpp or its source files
// If missing, include or implement it accordingly

static const char* DAY_NAME[5] = {"Mon","Tue","Wed","Thu","Fri"};

// ---------- JSON helpers (no external library) ----------
static string json_escape(const string& s) {
  string o; o.reserve(s.size() + 16);
  for (unsigned char c : s) {
    switch (c) {
      case '\"': o += "\\\""; break;
      case '\\': o += "\\\\"; break;
      case '\b': o += "\\b"; break;
      case '\f': o += "\\f"; break;
      case '\n': o += "\\n"; break;
      case '\r': o += "\\r"; break;
      case '\t': o += "\\t"; break;
      default:
        if (c < 0x20) {
          char buf[7];
          snprintf(buf, sizeof(buf), "\\u%04x", c);
          o += buf;
        } else {
          o += char(c);
        }
    }
  }
  return o;
}

// Simple JSON parsing helpers for this specific input format
// Note: For production, use a proper JSON library like nlohmann/json

struct InputDataJSON {
  string dept;
  int semester;
  int batches;
  string start_date;
  string end_date;
  vector<Subject> subs;
};

// Simple JSON parser for the expected input format
InputDataJSON parse_input_json(const string& json_str) {
  InputDataJSON input;
  // Parse JSON manually using string operations
  // Expected format: {"classrooms":1,"batches":2,"subjects":["Math","OS",...],"department":"Electronics","semester":"4","classesPerWeek":5,"maxLeaves":0,"numSubjects":7,"semesterStart":"2025-10-03","semesterEnd":"2026-01-16"}

  // Extract values using string find
  size_t pos = 0;

  // batches
  pos = json_str.find("\"batches\":", pos);
  if (pos != string::npos) {
    pos += 10; // length of "\"batches\":"
    size_t end = json_str.find(",", pos);
    input.batches = stoi(json_str.substr(pos, end - pos));
  } else {
    input.batches = 1; // default
  }

  // department
  pos = json_str.find("\"department\":\"", pos);
  if (pos != string::npos) {
    pos += 14; // length of "\"department\":\""
    size_t end = json_str.find("\"", pos);
    input.dept = json_str.substr(pos, end - pos);
  } else {
    input.dept = "CSE"; // default
  }

  // semester
  pos = json_str.find("\"semester\":\"", pos);
  if (pos != string::npos) {
    pos += 12; // length of "\"semester\":\""
    size_t end = json_str.find("\"", pos);
    input.semester = stoi(json_str.substr(pos, end - pos));
  } else {
    input.semester = 1; // default
  }

  // semesterStart
  pos = json_str.find("\"semesterStart\":\"", pos);
  if (pos != string::npos) {
    pos += 17; // length of "\"semesterStart\":\""
    size_t end = json_str.find("\"", pos);
    input.start_date = json_str.substr(pos, end - pos);
  } else {
    input.start_date = "2025-08-01"; // default
  }

  // semesterEnd
  pos = json_str.find("\"semesterEnd\":\"", pos);
  if (pos != string::npos) {
    pos += 15; // length of "\"semesterEnd\":\""
    size_t end = json_str.find("\"", pos);
    input.end_date = json_str.substr(pos, end - pos);
  } else {
    input.end_date = "2025-12-15"; // default
  }

  // subjects
  pos = json_str.find("\"subjects\":", pos);
  if (pos != string::npos) {
    pos += 12; // length of "\"subjects\":"
    size_t end = json_str.find("]", pos);
    string subjects_str = json_str.substr(pos, end - pos + 1);
    // Parse array ["item1","item2",...]
    size_t start = subjects_str.find("[");
    if (start != string::npos) {
      subjects_str = subjects_str.substr(start + 1, subjects_str.size() - start - 2);
      stringstream ss(subjects_str);
      string item;
      while (getline(ss, item, ',')) {
        // Remove quotes
        if (item.size() >= 2 && item[0] == '"' && item.back() == '"') {
          item = item.substr(1, item.size() - 2);
        }
        if (!item.empty()) {
          input.subs.push_back(Subject{item, 1}); // Assume credits=1
        }
      }
    }
  } else {
    input.subs = {Subject{"DBMS", 4}, Subject{"OS", 3}, Subject{"Algorithms", 4}, Subject{"Data Structures", 3}, Subject{"Computer Networks", 3}, Subject{"Software Engineering", 3}}; // default BTech CSE subjects
  }

  return input;
}

// Serialize output to JSON string
static string serialize_output(const Output& out, const InputData& in) {
  stringstream ss;
  ss << "{\n";
  ss << "  \"meta\": {\n";
  ss << "    \"department\": \"" << json_escape(in.dept) << "\",\n";
  ss << "    \"semester\": " << in.semester << ",\n";
  ss << "    \"batches\": " << in.batches << ",\n";
  ss << "    \"weeks\": " << out.weeks << ",\n";
  ss << "    \"periods_per_day\": " << out.P << ",\n";
  ss << "    \"days\": [\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\"],\n";
  ss << "    \"weekly_counts\": [";
  for (size_t i=0; i<out.weekly_counts.size(); ++i) {
    if (i) ss << ", ";
    ss << "{\"subject\":\"" << json_escape(out.weekly_counts[i].first)
       << "\",\"weekly\":" << out.weekly_counts[i].second << "}";
  }
  ss << "]\n";
  ss << "  },\n";

  ss << "  \"sections\": [\n";
  for (size_t sidx=0; sidx<out.sections.size(); ++sidx) {
    const auto& sp = out.sections[sidx];
    ss << "    {\n";
    ss << "      \"section\": \"" << json_escape(sp.section) << "\",\n";
    ss << "      \"table\": {\n";
    for (int d=0; d<5; ++d) {
      ss << "        \"" << DAY_NAME[d] << "\": [";
      for (int p=0; p<sp.plan.P; ++p) {
        if (p) ss << ", ";
        string cell = sp.plan.table[d][p];
        if (cell == "-" || cell.empty()) cell.clear();
        ss << "\"" << json_escape(cell) << "\"";
      }
      ss << "]";
      ss << (d==4 ? "\n" : ",\n");
    }
    ss << "      }\n";
    ss << "    }" << (sidx+1==out.sections.size() ? "\n" : ",\n");
  }
  ss << "  ]\n";
  ss << "}\n";
  return ss.str();
}

static string read_stdin_all() {
  stringstream ss;
  ss << cin.rdbuf();
  return ss.str();
}

int main() {
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
  in.subs = input_data_json.subs;

  // To generate 3 timetables per batch, each with 3 phases, multiply batches by 9
  in.batches = 9 * in.batches;

  // Generate timetable
  auto out = build_schedule(in);

  // Print output JSON to stdout
  string output_json = serialize_output(out, in);
  cout << output_json;

  return 0;
}
