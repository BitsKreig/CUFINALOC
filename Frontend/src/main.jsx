ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/app" element={<App />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);
=======
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/app" element={<App />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);
=======
        <Route path="/" element={<LoginPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/app" element={<App />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/register" element={<RegisterPage />} />

>>>>>>> 5b326d3db6f5c6628fb1241b2577c45200d10acf
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);