# TODO: Fix Timetable Generation - Each Option Showing Two Timetables Instead of One

## Completed Steps
- [x] Analyze the issue: Each option in phases is showing two timetables (sections) instead of one.
- [x] Identify root cause: In `Backend/src/simple_scheduler.hpp`, the `build_schedule` function generates 2 plans per batch (alt < 2).
- [x] Modify `Backend/src/simple_scheduler.hpp`: Change the loop from `for (int alt = 0; alt < 2; ++alt)` to `for (int alt = 0; alt < 1; ++alt)` and remove the `+ "_" + std::to_string(alt + 1)` from section name.
- [x] Commit the changes to git.
- [x] Recompile the C++ executable (`main.exe`) with the updated code.

## Pending Steps
- [x] Restart the backend server to use the updated executable.
- [x] Test the timetable generation: Generate timetables and verify that each option in each phase shows only one timetable (section).
- [x] If issues persist, check the frontend display logic or backend grouping.

## Notes
- The backend uses `main.exe` compiled from `main.cpp`, which calls `build_schedule` from `simple_scheduler.hpp`.
- With `batches=1` (default), each phase has 3 options, each with 1 section (timetable).
- No changes needed in Python backend or frontend, as the grouping already handles one section per option per batch.
