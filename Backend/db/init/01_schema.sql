-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.batch (
  batchid text NOT NULL,
  semester integer NOT NULL,
  CONSTRAINT batch_pkey PRIMARY KEY (batchid)
);
CREATE TABLE public.department (
  deptid text NOT NULL,
  deptname character varying NOT NULL,
  CONSTRAINT department_pkey PRIMARY KEY (deptid)
);
CREATE TABLE public.faculty (
  facultyid text NOT NULL,
  facultyname character varying NOT NULL,
  deptid text NOT NULL,
  CONSTRAINT faculty_pkey PRIMARY KEY (facultyid),
  CONSTRAINT fkfacultydeptid FOREIGN KEY (deptid) REFERENCES public.department(deptid)
);
CREATE TABLE public.facultysubject (
  facultyid text NOT NULL,
  subjectid text NOT NULL,
  CONSTRAINT facultysubject_pkey PRIMARY KEY (facultyid, subjectid),
  CONSTRAINT fkfacultysubjectfacultyid FOREIGN KEY (facultyid) REFERENCES public.faculty(facultyid),
  CONSTRAINT fkfacultysubjectsubjectid FOREIGN KEY (subjectid) REFERENCES public.subject(subjectid)
);
CREATE TABLE public.students (
  studentid text NOT NULL,
  studentname character varying NOT NULL,
  deptid text NOT NULL,
  semester integer NOT NULL,
  batchid text,
  CONSTRAINT students_pkey PRIMARY KEY (studentid),
  CONSTRAINT fkstudentsbatchid FOREIGN KEY (batchid) REFERENCES public.batch(batchid),
  CONSTRAINT fkstudentsdeptid FOREIGN KEY (deptid) REFERENCES public.department(deptid)
);
CREATE TABLE public.subject (
  subjectid text NOT NULL,
  subjectname character varying NOT NULL,
  credits integer NOT NULL,
  deptid text NOT NULL,
  CONSTRAINT subject_pkey PRIMARY KEY (subjectid),
  CONSTRAINT fksubjectdeptid FOREIGN KEY (deptid) REFERENCES public.department(deptid)
);
CREATE TABLE public.users (
  userid text NOT NULL,
  passwordhash character varying NOT NULL,
  username character varying NOT NULL,
  role text NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (userid)
);