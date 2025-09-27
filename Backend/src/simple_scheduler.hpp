// #pragma once
#include <string>
#include <vector>
#include <utility>
#include <cmath>
#include <algorithm>
#include <random>
#include <numeric>
#include <chrono>
#include <cstdio>

// A tiny, clean scheduler that:
// - takes dept/semester/batches, semester start/end, subjects(+credits)
// - admin chooses grid policy: P periods/day, min..max classes per day
// - computes weekly subject counts proportional to credits
// - creates 5-day (Mon..Fri) timetables with gaps and diversity per section

namespace sched {

// ---------- basic types ----------
struct Subject {
  std::string name;
  int credits{0};
};

struct Date { int y{1970}, m{1}, d{1}; };

struct WeeklyPlan {
  int P{6};
  // 5 rows (Mon..Fri) × P columns (periods), "-" means gap
  std::vector<std::vector<std::string>> table;
  explicit WeeklyPlan(int P_=6) : P(P_), table(5, std::vector<std::string>(P_, "-")) {}
};

struct SectionPlan {
  std::string section; // e.g., "CSE_5_A"
  WeeklyPlan plan;
};

struct Output {
  int weeks{0};
  int mon_fri_days{0};
  int P{0};
  // (subject, weekly classes)
  std::vector<std::pair<std::string,int>> weekly_counts;
  // plans for each section
  std::vector<SectionPlan> sections;
};

struct InputData {
  std::string dept;         // e.g., "CSE"
  int semester{1};          // e.g., 5
  int batches{1};           // e.g., 5  -> A..E
  std::string start_date;   // YYYY-MM-DD
  std::string end_date;     // YYYY-MM-DD

  // Admin policy for the grid & gaps
  int periods_per_day{6};       // P periods per day
  int min_classes_per_day{3};   // create gaps
  int max_classes_per_day{5};   // <= P

  std::vector<Subject> subs;    // subjects (same for all batches in this simple version)
};

// ---------- date helpers (only what we need) ----------
inline int dim(int y, int m) {
  static const int D[12] = {31,28,31,30,31,30,31,31,30,31,30,31};
  int v = D[(m-1+12)%12];
  // leap-year for Feb
  if (m == 2) {
    bool leap = ( (y%4==0 && y%100!=0) || (y%400==0) );
    if (leap) v = 29;
  }
  return v;
}

inline Date parse_date(const std::string& s) {
  Date t{};
  // very small/naive parser: "YYYY-MM-DD"
  std::sscanf(s.c_str(), "%d-%d-%d", &t.y, &t.m, &t.d);
  return t;
}

inline void inc(Date& dt) { // dt = dt + 1 day
  dt.d++;
  if (dt.d > dim(dt.y, dt.m)) {
    dt.d = 1; dt.m++;
    if (dt.m > 12) { dt.m = 1; dt.y++; }
  }
}

// Zeller’s congruence: h = 0..6 for Sat..Fri
inline int zeller_wday(const Date& dt) {
  int y = dt.y, m = dt.m, d = dt.d;
  if (m < 3) { m += 12; --y; }
  int K = y % 100;
  int J = y / 100;
  int h = (d + (13*(m+1))/5 + K + K/4 + J/4 + 5*J) % 7; // 0=Sat,1=Sun,2=Mon,...,6=Fri
  return h;
}

// Convert to 0=Mon .. 6=Sun
inline int weekday_0mon(const Date& dt) {
  static int map7[7] = {5,6,0,1,2,3,4}; // Sat->5, Sun->6, Mon->0, ... Fri->4
  return map7[zeller_wday(dt)];
}

// Count Mon..Fri between two YYYY-MM-DD inclusive
inline int count_weekdays(const std::string& a, const std::string& b) {
  Date A = parse_date(a), B = parse_date(b);
  auto key = [](const Date& t){ return t.y*10000 + t.m*100 + t.d; };
  if (key(A) > key(B)) std::swap(A, B);
  int cnt = 0;
  for (Date t = A; key(t) <= key(B); inc(t)) {
    int wd = weekday_0mon(t); // 0..6
    if (wd <= 4) ++cnt;       // Mon..Fri
  }
  return cnt;
}

// ---------- small utilities ----------

// proportional rounding so that sum(parts) == target
inline std::vector<int> proportional_split(const std::vector<double>& w, int target) {
  std::vector<int> out(w.size(), 0);
  double W = 0.0; for (double x : w) W += x;
  if (W <= 0.0) return out;
  std::vector<double> raw(w.size());
  std::vector<int> flo(w.size());
  std::vector<std::pair<double,int>> frac; frac.reserve(w.size());
  int sum = 0;
  for (int i = 0; i < (int)w.size(); ++i) {
    raw[i] = (w[i] / W) * target;
    flo[i] = (int)std::floor(raw[i]);
    sum += flo[i];
    frac.push_back({raw[i] - flo[i], i});
  }
  int rem = target - sum;
  std::sort(frac.begin(), frac.end(), [](auto& a, auto& b){ return a.first > b.first; });
  for (int k = 0; k < rem && k < (int)frac.size(); ++k) flo[frac[k].second] += 1;
  return flo;
}

// choose k distinct period indices from [0..P-1]
inline std::vector<int> sample_periods(std::mt19937& rng, int P, int k) {
  k = std::max(0, std::min(P, k));
  std::vector<int> idx(P); std::iota(idx.begin(), idx.end(), 0);
  std::shuffle(idx.begin(), idx.end(), rng);
  idx.resize(k);
  std::sort(idx.begin(), idx.end());
  return idx;
}

inline bool equal_plan(const WeeklyPlan& A, const WeeklyPlan& B) {
  if (A.P != B.P) return false;
  return A.table == B.table;
}

inline std::string section_id(const std::string& dept, int sem, int k) {
  return dept + "_" + std::to_string(sem) + "_" + char('A' + k);
}

// ---------- main builder ----------
inline Output build_schedule(const InputData& in) {
  Output out;

  // 1) weeks from dates
  out.mon_fri_days = count_weekdays(in.start_date, in.end_date);
  out.weeks = (int)std::ceil(out.mon_fri_days / 5.0);

  // 2) grid policy
  out.P = in.periods_per_day;
  auto clamp = [](int v, int lo, int hi) { return std::max(lo, std::min(v, hi)); };
  const int minD = clamp(in.min_classes_per_day, 0, out.P);
  const int maxD = clamp(in.max_classes_per_day, minD, out.P);
  const double avgD = (minD + maxD) / 2.0;
  const int weekly_capacity = (int)std::round(avgD * 5.0); // 5 weekdays

  // 3) split weekly capacity across subjects ∝ credits (ensure at least 1 when possible)
  std::vector<double> w; w.reserve(in.subs.size());
  for (auto& s : in.subs) w.push_back(std::max(0, s.credits));
  auto split = proportional_split(w, std::max(1, weekly_capacity));
  // try to lift zeros to 1 if room remains
  int zeros = 0, used = 0;
  for (int v : split) { if (v==0) ++zeros; used += v; }
  int spare = std::max(0, weekly_capacity - used);
  for (int i=0; i<(int)split.size() && spare>0; ++i) if (split[i]==0) { split[i]=1; --spare; }

  for (int i=0; i<(int)in.subs.size(); ++i)
    out.weekly_counts.push_back({in.subs[i].name, split[i]});

  // subject bag (names repeated by weekly count)
  std::vector<std::string> base_bag;
  for (int i=0;i<(int)in.subs.size();++i)
    for (int k=0;k<split[i];++k) base_bag.push_back(in.subs[i].name);

  // 4) one plan per batch
  WeeklyPlan prev(out.P);
  for (int b = 0; b < in.batches; ++b) {
    for (int alt = 0; alt < 1; ++alt) {
      const std::string sec = section_id(in.dept, in.semester, b);
      WeeklyPlan plan(out.P);

      std::mt19937 rng(
        (unsigned)std::chrono::high_resolution_clock::now().time_since_epoch().count()
        + b * 7919u + alt * 12345u
      );

      // 4a) choose classes per day k[d] in [minD,maxD], then adjust to weekly_capacity
      std::vector<int> k(5, minD);
      if (maxD > minD) {
        std::uniform_int_distribution<int> U(minD, maxD);
        for (int d=0; d<5; ++d) k[d] = U(rng);
      }
      auto sumk = [&]{ int s=0; for (int v: k) s += v; return s; };
      int S = sumk();
      while (S < weekly_capacity) { int d = rng()%5; if (k[d] < maxD) { ++k[d]; ++S; } }
      while (S > weekly_capacity) { int d = rng()%5; if (k[d] > minD) { --k[d]; --S; } }

      // 4b) pick which periods to fill (others remain "-")
      std::vector<std::vector<int>> fill_idx(5);
      for (int d=0; d<5; ++d) fill_idx[d] = sample_periods(rng, out.P, k[d]);

      // 4c) section-specific shuffled/rotated bag
      std::vector<std::string> bag = base_bag;
      std::shuffle(bag.begin(), bag.end(), rng);
      if (!bag.empty()) {
        int shift = (b * 2 + alt) % (int)bag.size();
        std::rotate(bag.begin(), bag.begin()+shift, bag.end());
      }
      int ptr = 0;

      // 4d) place subjects into chosen slots
      for (int d=0; d<5; ++d)
        for (int pIdx : fill_idx[d])
          if (ptr < (int)bag.size())
            plan.table[d][pIdx] = bag[ptr++];

      // 4e) avoid identical plan as previous section
      if (!out.sections.empty() && equal_plan(plan, prev)) {
        std::shuffle(bag.begin(), bag.end(), rng);
        ptr = 0;
        for (int d=0; d<5; ++d)
          for (int pIdx : fill_idx[d])
            if (ptr < (int)bag.size())
              plan.table[d][pIdx] = bag[ptr++];
      }
      prev = plan;

      out.sections.push_back({sec, std::move(plan)});
    }
  }

  return out;
}

} // namespace sched
