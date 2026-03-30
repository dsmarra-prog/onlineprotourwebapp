--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.system_settings VALUES ('autodarts_refresh_token', 'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI2N2JkNDAwMi1kNTA1LTQ2NzEtODk5Yi03Y2M3MDJlMjlhMjUifQ.eyJleHAiOjE3NzU0MDM3MDMsImlhdCI6MTc3NDc5ODkwMywianRpIjoiMzc5MWJmZWUtOTkzNy00NzJmLTk2ZmQtN2Q3ZmZhYjAxMzIxIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5hdXRvZGFydHMuaW8vcmVhbG1zL2F1dG9kYXJ0cyIsImF1ZCI6Imh0dHBzOi8vbG9naW4uYXV0b2RhcnRzLmlvL3JlYWxtcy9hdXRvZGFydHMiLCJzdWIiOiIxZDViODMxMC0wNjAzLTRjOGEtYTljMy1jNmJiOWZkN2VlNDEiLCJ0eXAiOiJSZWZyZXNoIiwiYXpwIjoiYXV0b2RhcnRzLXBsYXkiLCJub25jZSI6IjFhYjVmNDg3LWNkMGItNDlmNC1iYTc1LWE4NTJkOTBiM2E3MyIsInNlc3Npb25fc3RhdGUiOiI4NWU5MWRhYi0xZDdlLTQyNjMtOGNlNi0zMGM0ODNjZmE5MWIiLCJzY29wZSI6InByb2ZpbGUgb3BlbmlkIGVtYWlsIiwic2lkIjoiODVlOTFkYWItMWQ3ZS00MjYzLThjZTYtMzBjNDgzY2ZhOTFiIn0.DAHSVsDWWJxD4m473o5MP0-KIvmiWJIgqCXaDoMvzB4', '2026-03-29 15:41:43.881');


--
-- Data for Name: tour_dev_oom_standings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tour_dev_oom_standings VALUES (1, 1, 1, 'veterdarto180', 1650, 0, 4, '[{"t":"DC2","p":25},{"t":"DC3","p":600},{"t":"DC4","p":1000},{"t":"DC5","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (2, 1, 2, 'spinpuke', 1600, 0, 5, '[{"t":"DC1","p":25},{"t":"DC2","p":150},{"t":"DC4","p":25},{"t":"DC5","p":1000},{"t":"DC6","p":400}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (3, 1, 3, 'babu9435', 1400, 0, 3, '[{"t":"DC1","p":1000},{"t":"DC2","p":250},{"t":"DC4","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (4, 1, 4, 'roman910433', 1325, 0, 6, '[{"t":"DC1","p":25},{"t":"DC2","p":250},{"t":"DC3","p":25},{"t":"DC4","p":25},{"t":"DC5","p":600},{"t":"DC6","p":400}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (5, 1, 5, 'redstar10.', 1275, 0, 3, '[{"t":"DC4","p":25},{"t":"DC5","p":250},{"t":"DC6","p":1000}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (6, 1, 6, 'the_maniac040', 1250, 0, 3, '[{"t":"DC1","p":250},{"t":"DC2","p":400},{"t":"DC4","p":600}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (7, 1, 7, 'superseppensepp', 1100, 0, 4, '[{"t":"DC1","p":150},{"t":"DC3","p":400},{"t":"DC4","p":400},{"t":"DC5","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (8, 1, 8, 'pasqualo5693', 1050, 0, 3, '[{"t":"DC2","p":1000},{"t":"DC3","p":25},{"t":"DC4","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (9, 1, 9, 'dartmitbart.', 1000, 0, 2, '[{"t":"DC1","p":600},{"t":"DC5","p":400}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (10, 1, 10, 'thommy_the_gun_44538', 1000, 0, 1, '[{"t":"DC3","p":1000}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (11, 1, 11, 'mighty_maggo', 850, 0, 5, '[{"t":"DC1","p":25},{"t":"DC2","p":250},{"t":"DC3","p":150},{"t":"DC4","p":400},{"t":"DC5","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (12, 1, 12, 'lohoff44', 825, 0, 5, '[{"t":"DC1","p":25},{"t":"DC3","p":25},{"t":"DC4","p":150},{"t":"DC5","p":25},{"t":"DC6","p":600}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (13, 1, 13, 'jaykopp_1988', 675, 0, 3, '[{"t":"DC1","p":400},{"t":"DC3","p":25},{"t":"DC5","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (14, 1, 14, 'rafi19931', 675, 0, 4, '[{"t":"DC1","p":150},{"t":"DC2","p":25},{"t":"DC4","p":250},{"t":"DC5","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (15, 1, 15, 'chriko91', 650, 0, 2, '[{"t":"DC3","p":400},{"t":"DC4","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (16, 1, 16, 'marhol13_70756', 650, 0, 2, '[{"t":"DC4","p":250},{"t":"DC5","p":400}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (17, 1, 17, 'puetten77', 600, 0, 1, '[{"t":"DC2","p":600}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (18, 1, 18, 'infernohunter1405', 575, 0, 4, '[{"t":"DC1","p":250},{"t":"DC2","p":25},{"t":"DC3","p":150},{"t":"DC4","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (19, 1, 19, 'mawoit', 575, 0, 5, '[{"t":"DC1","p":250},{"t":"DC2","p":25},{"t":"DC3","p":25},{"t":"DC4","p":250},{"t":"DC5","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (20, 1, 20, 'quasi_4400', 550, 0, 3, '[{"t":"DC3","p":250},{"t":"DC4","p":150},{"t":"DC5","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (21, 1, 21, 'uwe_madhouse', 550, 0, 2, '[{"t":"DC1","p":150},{"t":"DC2","p":400}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (22, 1, 22, 'bernybonebreaker.', 450, 0, 4, '[{"t":"DC1","p":250},{"t":"DC2","p":25},{"t":"DC3","p":25},{"t":"DC4","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (23, 1, 23, 'djbounceger', 425, 0, 3, '[{"t":"DC1","p":25},{"t":"DC3","p":250},{"t":"DC4","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (24, 1, 24, 'perzy_07', 400, 0, 1, '[{"t":"DC1","p":400}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (25, 1, 25, 'sx197', 350, 0, 5, '[{"t":"DC1","p":25},{"t":"DC2","p":25},{"t":"DC3","p":25},{"t":"DC4","p":25},{"t":"DC5","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (26, 1, 26, 'manu791904', 325, 0, 4, '[{"t":"DC3","p":25},{"t":"DC4","p":25},{"t":"DC5","p":250},{"t":"DC6","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (27, 1, 27, 'polo1501', 325, 0, 4, '[{"t":"DC1","p":25},{"t":"DC2","p":25},{"t":"DC4","p":25},{"t":"DC5","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (28, 1, 28, 'revilocb', 325, 0, 3, '[{"t":"DC1","p":150},{"t":"DC2","p":25},{"t":"DC3","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (29, 1, 29, 'caostommy.', 300, 0, 2, '[{"t":"DC1","p":150},{"t":"DC2","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (30, 1, 30, '.teggy_weggy', 275, 0, 2, '[{"t":"DC1","p":25},{"t":"DC2","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (31, 1, 31, 'haui75', 250, 0, 1, '[{"t":"DC3","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (32, 1, 32, 'maxmustermann12', 250, 0, 1, '[{"t":"DC5","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (33, 1, 33, 'rupal492', 250, 0, 1, '[{"t":"DC5","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (34, 1, 34, 'schalli1988', 250, 0, 1, '[{"t":"DC3","p":250}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (35, 1, 35, 'coolness2punkt0', 200, 0, 3, '[{"t":"DC1","p":25},{"t":"DC3","p":150},{"t":"DC4","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (36, 1, 36, 'd9music', 200, 0, 3, '[{"t":"DC1","p":150},{"t":"DC3","p":25},{"t":"DC4","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (37, 1, 37, 'mirmlinger', 175, 0, 2, '[{"t":"DC1","p":150},{"t":"DC2","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (38, 1, 38, 'roevergaming', 175, 0, 2, '[{"t":"DC2","p":150},{"t":"DC5","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (39, 1, 39, 'baf01552', 150, 0, 1, '[{"t":"DC3","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (40, 1, 40, 'shiouk', 150, 0, 1, '[{"t":"DC2","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (41, 1, 41, 'tobi1888', 150, 0, 1, '[{"t":"DC4","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (42, 1, 42, 'x999jey', 150, 0, 1, '[{"t":"DC1","p":150}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (43, 1, 43, 'holgik66', 75, 0, 3, '[{"t":"DC1","p":25},{"t":"DC3","p":25},{"t":"DC4","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (44, 1, 44, 'dartcore25_23442', 50, 0, 2, '[{"t":"DC3","p":25},{"t":"DC4","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (45, 1, 45, 'dcschiltornboyz', 50, 0, 2, '[{"t":"DC2","p":25},{"t":"DC3","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (46, 1, 46, 'tobi1879.', 50, 0, 2, '[{"t":"DC3","p":25},{"t":"DC4","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (47, 1, 47, 'zorax0681', 50, 0, 2, '[{"t":"DC1","p":25},{"t":"DC3","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (48, 1, 48, 'benbuttons', 25, 0, 1, '[{"t":"DC2","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (49, 1, 49, 'dcgartenzwerge', 25, 0, 1, '[{"t":"DC5","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (50, 1, 50, 'dt09_83', 25, 0, 1, '[{"t":"DC2","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (51, 1, 51, 'grauwolfjan', 25, 0, 1, '[{"t":"DC1","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (52, 1, 52, 'ironprecision', 25, 0, 1, '[{"t":"DC4","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (53, 1, 53, 'sc3ptiix', 25, 0, 1, '[{"t":"DC2","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (54, 1, 54, 'super_mario1981', 25, 0, 1, '[{"t":"DC6","p":25}]', '30.3.2026');
INSERT INTO public.tour_dev_oom_standings VALUES (55, 1, 55, 'wummanizer', 25, 0, 1, '[{"t":"DC2","p":25}]', '30.3.2026');


--
-- Data for Name: tour_entries; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tour_entries VALUES (4, 2, 1, 1, false, 'approved');
INSERT INTO public.tour_entries VALUES (5, 2, 2, 2, false, 'approved');
INSERT INTO public.tour_entries VALUES (6, 3, 1, 1, false, 'approved');
INSERT INTO public.tour_entries VALUES (7, 3, 2, 2, false, 'approved');
INSERT INTO public.tour_entries VALUES (9, 4, 2, 1, false, 'approved');
INSERT INTO public.tour_entries VALUES (43, 13, 1, 1, false, 'approved');
INSERT INTO public.tour_entries VALUES (76, 13, 2, 2, false, 'approved');
INSERT INTO public.tour_entries VALUES (109, 46, 1, 1, false, 'approved');
INSERT INTO public.tour_entries VALUES (142, 46, 2, 2, false, 'approved');
INSERT INTO public.tour_entries VALUES (208, 79, 2, 2, false, 'approved');
INSERT INTO public.tour_entries VALUES (175, 79, 1, 1, true, 'approved');


--
-- Data for Name: tour_matches; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tour_matches VALUES (4, 2, 'F', 1, 1, 2, 1, 3, 0, 'abgeschlossen', false, '019d3a19-d5cd-75c9-9244-d417dc8b0725', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.tour_matches VALUES (5, 3, 'F', 1, 1, 2, 1, 3, 0, 'abgeschlossen', false, '019d3a2e-8cc6-77df-b36a-c47bfb852351', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.tour_matches VALUES (6, 13, 'F', 1, 1, 2, NULL, NULL, NULL, 'ausstehend', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.tour_matches VALUES (39, 46, 'F', 1, 1, 2, NULL, NULL, NULL, 'ausstehend', false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.tour_matches VALUES (72, 79, 'F', 1, 1, 2, NULL, NULL, NULL, 'ausstehend', false, '019d3e4a-e8a7-7e08-8aca-fa3c3ed64717', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: tour_oom_standings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tour_oom_standings VALUES (127, 1, 8, 'mg_82', 1500, 0, 6, '{"PC4":400,"PC5":25,"PC6":400,"PC7":600,"Spring Open":50,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (130, 1, 11, 'elitedragon94', 1150, 0, 6, '{"PC3":250,"PC4":150,"PC6":250,"PC7":25,"Spring Open":225,"PC8":250}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (133, 1, 14, 'babu9435', 950, 0, 8, '{"PC1":150,"PC2":150,"PC3":150,"PC4":75,"PC6":25,"PC7":150,"Spring Open":225,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (136, 1, 17, 'paradoxx180', 875, 0, 8, '{"PC1":25,"PC2":25,"PC3":25,"PC4":250,"PC5":400,"PC6":75,"PC7":25,"Spring Open":50}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (139, 1, 20, 'drandi1887', 725, 0, 4, '{"PC2":25,"PC3":75,"PC5":25,"PC8":600}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (142, 1, 23, 'felln', 600, 0, 6, '{"PC3":150,"PC4":150,"PC5":25,"PC7":25,"Spring Open":225,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (145, 1, 26, 'fleckigerfleck180', 475, 0, 4, '{"PC2":150,"PC3":25,"PC4":150,"PC5":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (148, 1, 29, 'dt09_83', 425, 0, 2, '{"PC5":25,"PC6":400}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (151, 1, 32, 'tinochef', 400, 0, 1, '{"PC8":400}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (154, 1, 35, 'franzet.__19126', 325, 0, 2, '{"PC5":75,"PC7":250}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (157, 1, 38, 'schumann180', 325, 0, 4, '{"PC2":250,"PC3":25,"PC4":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (160, 1, 41, 'lohoff44', 300, 0, 9, '{"PC1":25,"PC2":75,"PC3":25,"PC4":25,"PC5":25,"PC6":25,"PC7":25,"Spring Open":50,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (163, 1, 44, 'veterdarto180', 275, 0, 4, '{"PC3":25,"PC5":25,"PC6":75,"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (166, 1, 47, 'mawoit', 250, 0, 7, '{"PC2":25,"PC3":25,"PC4":75,"PC6":25,"PC7":25,"Spring Open":50,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (169, 1, 50, 'seb171_', 250, 0, 1, '{"PC1":250}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (172, 1, 53, 'sx197', 250, 0, 5, '{"PC1":25,"PC3":150,"PC4":25,"PC5":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (175, 1, 56, 'puetten77', 200, 0, 3, '{"PC3":25,"PC4":25,"PC7":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (178, 1, 59, 'schwatta09', 200, 0, 3, '{"PC3":25,"PC5":25,"PC6":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (181, 1, 62, 'dartsbydanil', 175, 0, 2, '{"PC2":25,"PC4":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (184, 1, 65, 'the_maniac040', 175, 0, 5, '{"PC3":75,"PC4":25,"PC5":25,"PC6":25,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (187, 1, 68, 'holgik66', 150, 0, 3, '{"PC6":25,"PC7":75,"Spring Open":50}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (190, 1, 71, 'revilocb', 150, 0, 1, '{"PC4":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (193, 1, 74, 'wanagin', 150, 0, 1, '{"PC6":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (196, 1, 77, 'superseppensepp', 125, 0, 3, '{"PC4":25,"PC5":75,"PC6":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (199, 1, 80, 'ironprecision', 100, 0, 2, '{"PC3":25,"PC4":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (202, 1, 83, 'theblackforest92', 100, 0, 2, '{"PC1":25,"PC3":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (205, 1, 86, 'kev_180', 75, 0, 1, '{"PC3":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (208, 1, 89, 'slevin_93004_98258', 75, 0, 1, '{"PC1":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (211, 1, 92, 'coolness2punkt0', 50, 0, 2, '{"PC1":25,"PC3":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (214, 1, 95, 'rafi19931', 50, 0, 2, '{"PC5":25,"PC6":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (217, 1, 98, 'bjorn0976', 25, 0, 1, '{"PC1":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (220, 1, 101, 'fanatikal_91', 25, 0, 1, '{"PC6":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (223, 1, 104, 'gladbach131', 25, 0, 1, '{"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (226, 1, 107, 'markt.1988', 25, 0, 1, '{"PC1":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (229, 1, 110, 'nurrox', 25, 0, 1, '{"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (232, 1, 113, 'schalli1988', 25, 0, 1, '{"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (235, 1, 116, 'the_snipper', 25, 0, 1, '{"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (238, 1, 119, 'zorax0681', 25, 0, 1, '{"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (128, 1, 9, 'jensonjdv2110', 1200, 0, 6, '{"PC1":150,"PC3":250,"PC4":25,"PC5":150,"PC6":250,"Spring Open":375}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (131, 1, 12, 'sulmi.', 1075, 0, 6, '{"PC4":250,"PC5":150,"PC6":150,"PC7":400,"Spring Open":50,"PC8":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (134, 1, 15, 'infernohunter1405', 950, 0, 6, '{"PC3":150,"PC5":250,"PC6":25,"PC7":150,"Spring Open":225,"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (137, 1, 18, 'd9music', 800, 0, 4, '{"PC3":400,"PC4":150,"PC5":25,"Spring Open":225}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (140, 1, 21, 'bernybonebreaker.', 675, 0, 7, '{"PC1":150,"PC2":25,"PC4":150,"PC6":75,"PC7":25,"Spring Open":225,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (143, 1, 24, 'the_sharpshooter_', 575, 0, 4, '{"PC1":250,"PC3":25,"PC6":250,"Spring Open":50}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (146, 1, 27, 'schrder', 475, 0, 2, '{"PC2":400,"PC3":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (149, 1, 30, 'dynamite_dave83', 425, 0, 7, '{"PC3":25,"PC4":25,"PC5":75,"PC6":75,"PC7":150,"Spring Open":50,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (152, 1, 33, 'n1k_92', 350, 0, 3, '{"PC1":75,"PC3":250,"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (155, 1, 36, 'koboto.', 325, 0, 3, '{"PC1":150,"PC2":150,"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (158, 1, 39, 'boiza8899', 300, 0, 2, '{"PC6":150,"PC7":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (161, 1, 42, 'haui75', 275, 0, 5, '{"PC1":150,"PC2":25,"PC3":25,"PC5":25,"Spring Open":50}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (164, 1, 45, 'caostommy.', 250, 0, 3, '{"PC5":150,"PC7":25,"PC8":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (167, 1, 48, 'mirmlinger', 250, 0, 5, '{"PC1":25,"PC2":150,"PC3":25,"PC4":25,"PC6":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (170, 1, 51, 'slevin1353', 250, 0, 1, '{"PC2":250}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (173, 1, 54, 'michaelk.1506', 225, 0, 2, '{"PC3":75,"PC4":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (176, 1, 57, 'quasi_4400', 200, 0, 3, '{"PC6":150,"PC7":25,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (179, 1, 60, 'senior_noskill', 200, 0, 3, '{"PC1":25,"PC3":150,"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (182, 1, 63, 'manu791904', 175, 0, 5, '{"PC2":25,"PC4":75,"PC5":25,"PC6":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (185, 1, 66, '.teggy_weggy', 150, 0, 4, '{"PC2":25,"PC3":75,"PC4":25,"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (188, 1, 69, 'jduffy512', 150, 0, 1, '{"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (191, 1, 72, 'rok180', 150, 0, 1, '{"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (194, 1, 75, 'furbys04', 125, 0, 5, '{"PC1":25,"PC2":25,"PC3":25,"PC4":25,"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (197, 1, 78, '_sprudel', 125, 0, 5, '{"PC1":25,"PC2":25,"PC3":25,"PC5":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (200, 1, 81, 'jan5799', 100, 0, 2, '{"PC3":25,"PC4":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (203, 1, 84, 'xshilex', 100, 0, 2, '{"PC1":25,"PC4":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (206, 1, 87, 'marshell420', 75, 0, 1, '{"PC8":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (209, 1, 90, 'alpaka00_', 50, 0, 2, '{"PC3":25,"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (212, 1, 93, 'dartcore25_23442', 50, 0, 2, '{"PC6":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (215, 1, 96, 'tobi1879.', 50, 0, 2, '{"PC4":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (218, 1, 99, 'dirko306', 25, 0, 1, '{"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (221, 1, 102, 'finnchr95', 25, 0, 1, '{"PC1":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (224, 1, 105, 'luckyluke02171', 25, 0, 1, '{"PC3":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (227, 1, 108, 'masterstev_68349', 25, 0, 1, '{"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (230, 1, 111, 'roevergaming', 25, 0, 1, '{"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (233, 1, 114, 'schegge_23', 25, 0, 1, '{"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (236, 1, 117, 'tuage_michel', 25, 0, 1, '{"PC1":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (120, 1, 1, 'sw4g89', 6500, 0, 9, '{"PC1":1000,"PC2":600,"PC3":400,"PC4":600,"PC5":150,"PC6":1000,"PC7":1000,"Spring Open":1500,"PC8":250}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (121, 1, 2, 'prachtbursche180', 3900, 0, 8, '{"PC1":250,"PC2":1000,"PC4":1000,"PC5":1000,"PC6":25,"PC7":250,"Spring Open":225,"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (122, 1, 3, 'markusv22', 2800, 0, 8, '{"PC1":400,"PC2":250,"PC3":600,"PC4":25,"PC5":600,"PC6":150,"PC7":400,"Spring Open":375}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (123, 1, 4, 'releven91', 2350, 100, 9, '{"PC1":700,"PC2":150,"PC3":150,"PC4":250,"PC5":250,"PC6":250,"PC7":150,"Spring Open":375,"PC8":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (124, 1, 5, 'sircrytex', 2025, 0, 4, '{"PC3":1000,"PC4":400,"PC5":25,"Spring Open":600}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (125, 1, 6, 'smarradinho', 1950, 0, 8, '{"PC1":75,"PC2":150,"PC3":75,"PC4":250,"PC6":600,"PC7":25,"Spring Open":375,"PC8":400}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (126, 1, 7, 'captinhoook_28219', 1675, 0, 8, '{"PC1":400,"PC2":400,"PC3":150,"PC5":150,"PC6":25,"PC7":250,"Spring Open":50,"PC8":250}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (129, 1, 10, 'purcello87_18488', 1175, 0, 3, '{"PC2":25,"Spring Open":900,"PC8":250}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (132, 1, 13, 'blackjackleo', 1000, 0, 1, '{"PC8":1000}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (135, 1, 16, 'patty024676', 900, 0, 6, '{"PC1":150,"PC2":25,"PC4":25,"PC5":25,"PC6":75,"Spring Open":600}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (138, 1, 19, 'chriko91', 750, 0, 4, '{"PC3":25,"PC5":250,"PC7":250,"Spring Open":225}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (141, 1, 22, 'roccoamore', 625, 0, 3, '{"PC2":150,"PC4":75,"PC5":400}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (144, 1, 25, 'mighty_maggo', 525, 0, 6, '{"PC3":25,"PC4":75,"PC5":75,"PC7":150,"Spring Open":50,"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (147, 1, 28, 'johnnoble9', 450, 0, 4, '{"PC3":25,"PC5":250,"PC6":150,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (150, 1, 31, 'dcschiltornboyz', 400, 0, 5, '{"PC1":250,"PC2":25,"PC3":25,"PC4":75,"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (153, 1, 34, 'thommy_the_gun_44538', 350, 0, 4, '{"PC1":25,"PC3":150,"PC4":25,"PC5":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (156, 1, 37, 'salvatoreocchipinti', 325, 0, 2, '{"PC2":250,"PC3":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (159, 1, 40, 'cb2402.', 300, 0, 6, '{"PC1":150,"PC2":25,"PC3":25,"PC5":25,"Spring Open":50,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (162, 1, 43, 'no.score.82', 275, 0, 2, '{"PC3":250,"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (165, 1, 46, 'djbounceger', 250, 0, 7, '{"PC2":25,"PC3":75,"PC4":25,"PC5":25,"PC6":25,"PC7":25,"Spring Open":50}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (168, 1, 49, 'redstar10.', 250, 0, 4, '{"PC6":25,"PC7":150,"Spring Open":50,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (171, 1, 52, 'spinpuke', 250, 0, 4, '{"PC5":25,"PC6":25,"Spring Open":50,"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (174, 1, 55, 'maexla_098', 200, 0, 3, '{"PC1":25,"PC2":150,"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (177, 1, 58, 'roman910433', 200, 0, 3, '{"PC2":25,"PC4":25,"PC5":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (180, 1, 61, 'shiouk', 200, 0, 3, '{"PC1":150,"PC2":25,"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (183, 1, 64, 'pasqualo5693', 175, 0, 2, '{"PC1":25,"PC6":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (186, 1, 67, 'fschmuck90', 150, 0, 1, '{"PC8":150}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (189, 1, 70, 'polo1501', 150, 0, 6, '{"PC2":25,"PC3":25,"PC4":25,"PC6":25,"PC7":25,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (192, 1, 73, 'uwe_madhouse', 150, 0, 4, '{"PC2":25,"PC4":75,"PC5":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (195, 1, 76, 'kruegman0147', 125, 0, 3, '{"PC2":25,"PC4":75,"PC6":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (198, 1, 79, 'gordon_1785', 100, 0, 2, '{"PC7":75,"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (201, 1, 82, 'simsoff', 100, 0, 2, '{"PC3":75,"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (204, 1, 85, 'grauwolfjan', 75, 0, 3, '{"PC1":25,"PC2":25,"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (207, 1, 88, 'sebastianpotscherterrax', 75, 0, 1, '{"PC4":75}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (210, 1, 91, 'basti3886', 50, 0, 2, '{"PC2":25,"PC3":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (213, 1, 94, 'jaykopp_1988', 50, 0, 2, '{"PC3":25,"PC7":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (216, 1, 97, 'trevi_26512', 50, 0, 2, '{"PC3":25,"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (219, 1, 100, 'drbongi', 25, 0, 1, '{"PC4":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (222, 1, 103, 'franzet._', 25, 0, 1, '{"PC3":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (225, 1, 106, 'manalexton', 25, 0, 1, '{"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (228, 1, 109, 'mira1860', 25, 0, 1, '{"PC6":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (231, 1, 112, 'sc3ptiix', 25, 0, 1, '{"PC5":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (234, 1, 115, 'thehornet180', 25, 0, 1, '{"PC8":25}', '26.03.2026');
INSERT INTO public.tour_oom_standings VALUES (237, 1, 118, 'x999jey', 25, 0, 1, '{"PC4":25}', '26.03.2026');


--
-- Data for Name: tour_players; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tour_players VALUES (2, 'maxmustermann12', 'maxmustermann12', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-03-29 13:33:44.849558', NULL, true, NULL, NULL);
INSERT INTO public.tour_players VALUES (3, 'mawo-IT', 'mawo-IT', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-03-29 13:33:44.891494', NULL, true, NULL, NULL);
INSERT INTO public.tour_players VALUES (1, 'smarradinho', 'smarradinho', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-03-29 13:33:44.504048', 'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI2N2JkNDAwMi1kNTA1LTQ2NzEtODk5Yi03Y2M3MDJlMjlhMjUifQ.eyJleHAiOjE3NzU0NzEzODksImlhdCI6MTc3NDg2NjU4OSwianRpIjoiMTRlNWI4MjAtODk5OS00ZWQ0LThlOGYtNWNjMjc3Yzc0NjZiIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5hdXRvZGFydHMuaW8vcmVhbG1zL2F1dG9kYXJ0cyIsImF1ZCI6Imh0dHBzOi8vbG9naW4uYXV0b2RhcnRzLmlvL3JlYWxtcy9hdXRvZGFydHMiLCJzdWIiOiIxZDViODMxMC0wNjAzLTRjOGEtYTljMy1jNmJiOWZkN2VlNDEiLCJ0eXAiOiJSZWZyZXNoIiwiYXpwIjoiYXV0b2RhcnRzLXBsYXkiLCJub25jZSI6IjM2NmI2MGY2LWI4NmMtNDIwNS05NjcxLTI1OWY2NzA4ZDM3NCIsInNlc3Npb25fc3RhdGUiOiI1MzJjZDE1My1lZWQ4LTQ2MGItOGEwNi02YjM4NmU3OTk1ZTkiLCJzY29wZSI6InByb2ZpbGUgb3BlbmlkIGVtYWlsIiwic2lkIjoiNTMyY2QxNTMtZWVkOC00NjBiLThhMDYtNmIzODZlNzk5NWU5In0.c1RkofmRifDHRlvMFwoaFcEj6xTeZwIg5pMhZW4nZe8', true, NULL, NULL);
INSERT INTO public.tour_players VALUES (4, 'Mehdi', 'Mehdimahdartsvikia', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-03-30 14:46:04.562601', NULL, false, NULL, NULL);


--
-- Data for Name: tour_schedule; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tour_schedule VALUES (1, 1, 'pro', 'pc', 'Phase 1 – Saisonstart (Sprint Phase)', 1, 'Players Championship 1', '18.01.2026', 'SO', '19:00', 'Bo5', NULL, 'abgeschlossen', 5);
INSERT INTO public.tour_schedule VALUES (2, 1, 'pro', 'pc', 'Phase 1 – Saisonstart (Sprint Phase)', 1, 'Players Championship 2', '22.01.2026', 'DO', '20:00', 'Bo5', NULL, 'abgeschlossen', 6);
INSERT INTO public.tour_schedule VALUES (3, 1, 'pro', 'pc', 'Phase 1 – Saisonstart (Sprint Phase)', 1, 'Players Championship 3', '25.01.2026', 'SO', '19:00', 'Bo5', NULL, 'abgeschlossen', 7);
INSERT INTO public.tour_schedule VALUES (4, 1, 'pro', 'pc', 'Phase 1 – Saisonstart (Sprint Phase)', 1, 'Players Championship 4', '29.01.2026', 'DO', '20:00', 'Bo5', NULL, 'abgeschlossen', 8);
INSERT INTO public.tour_schedule VALUES (5, 1, 'development', 'dev_cup', 'Development Tour – Start', 2, 'Development Cup 1', '01.02.2026', 'SO', '19:00', 'Bo3', NULL, 'abgeschlossen', 9);
INSERT INTO public.tour_schedule VALUES (6, 1, 'development', 'dev_cup', 'Development Tour – Start', 2, 'Development Cup 2', '05.02.2026', 'DO', '20:00', 'Bo3', NULL, 'abgeschlossen', 10);
INSERT INTO public.tour_schedule VALUES (7, 1, 'pro', 'pc', 'Phase 1 – Fortsetzung & Endspurt', 3, 'Players Championship 5', '08.02.2026', 'SO', '19:00', 'Bo5', NULL, 'abgeschlossen', 11);
INSERT INTO public.tour_schedule VALUES (8, 1, 'pro', 'pc', 'Phase 1 – Fortsetzung & Endspurt', 3, 'Players Championship 6', '19.02.2026', 'DO', '20:00', 'Bo5', NULL, 'abgeschlossen', 12);
INSERT INTO public.tour_schedule VALUES (9, 1, 'pro', 'pc', 'Phase 1 – Fortsetzung & Endspurt', 3, 'Players Championship 7', '01.03.2026', 'SO', '19:00', 'Bo5', NULL, 'abgeschlossen', 13);
INSERT INTO public.tour_schedule VALUES (10, 1, 'development', 'dev_cup', 'Development Tour – Fortsetzung', 4, 'Development Cup 3', '15.02.2026', 'SO', '20:00', 'Bo3', NULL, 'abgeschlossen', 14);
INSERT INTO public.tour_schedule VALUES (11, 1, 'development', 'dev_cup', 'Development Tour – Fortsetzung', 4, 'Development Cup 4', '22.02.2026', 'SO', '19:00', 'Bo3', NULL, 'abgeschlossen', 16);
INSERT INTO public.tour_schedule VALUES (12, 1, 'development', 'dev_cup', 'Development Tour – Fortsetzung', 4, 'Development Cup 5', '05.03.2026', 'DO', '20:00', 'Bo3', NULL, 'abgeschlossen', 15);
INSERT INTO public.tour_schedule VALUES (13, 1, 'development', 'dev_cup', 'Development Tour – Fortsetzung', 4, 'Development Cup 6', '21.03.2026', 'SA', '19:00', 'Bo3', NULL, 'abgeschlossen', 29);
INSERT INTO public.tour_schedule VALUES (14, 1, 'pro', 'm1', 'Major 1 – The Spring Open', 5, 'Spring Open 2026', '15.03.2026', 'SO', '17:00', 'Bo11', 'Top 32 OoM', 'abgeschlossen', 17);
INSERT INTO public.tour_schedule VALUES (15, 1, 'pro', 'pc', 'Phase 2 – Tactical Phase', 6, 'Players Championship 8', '26.03.2026', 'DO', '20:00', 'Bo5', NULL, 'abgeschlossen', 18);
INSERT INTO public.tour_schedule VALUES (16, 1, 'pro', 'pc', 'Phase 2 – Tactical Phase', 6, 'Players Championship 9', '05.04.2026', 'SO', '18:00', 'Bo5', NULL, 'upcoming', 19);
INSERT INTO public.tour_schedule VALUES (17, 1, 'development', 'dev_major', 'Development Tour – Pre Finals', 7, 'April Major', '02.04.2026', 'DO', '18:00', 'Bo7', 'Top 16 OoM', 'upcoming', 30);
INSERT INTO public.tour_schedule VALUES (18, 1, 'pro', 'm1', 'Major 2 – The Grand Prix (Double In/Out)', 8, 'Grand Prix (Di/Do)', '12.04.2026', 'SO', '17:00', 'Sets', 'Top 32 OoM', 'upcoming', 20);
INSERT INTO public.tour_schedule VALUES (19, 1, 'pro', 'pc', 'Haupttour – Späte Saison', 9, 'Players Championship 10', '16.04.2026', 'DO', '20:00', 'Bo5', NULL, 'upcoming', 21);
INSERT INTO public.tour_schedule VALUES (20, 1, 'pro', 'pc', 'Haupttour – Späte Saison', 9, 'Players Championship 11', '26.04.2026', 'SO', '18:00', 'Bo5', NULL, 'upcoming', 22);
INSERT INTO public.tour_schedule VALUES (21, 1, 'development', 'dev_major', 'Development Tour – Pre Finals', 7, 'May Major', '03.05.2026', 'SO', '18:00', 'Bo7', 'Top 16 OoM', 'upcoming', 23);
INSERT INTO public.tour_schedule VALUES (22, 1, 'pro', 'm2', 'Major 3 – Home Matchplay', 10, 'Home Matchplay', '10.05.2026', 'SO', '17:00', 'Sets', 'Top 32 OoM', 'upcoming', 25);
INSERT INTO public.tour_schedule VALUES (23, 1, 'development', 'dev_major', 'Development Tour – Grand Final', 11, 'Grand Final', '24.05.2026', 'SO', '18:00', 'Bo7', 'Top 16 OoM', 'upcoming', 24);


--
-- Data for Name: tour_tournaments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tour_tournaments VALUES (2, 'Testturnier', 'pc', '29.03.2026', 'abgeschlossen', 5, 2, '888df25ae35772424a560c7152a1de794440e0ea5cfee62828333a456a506e05', '2026-03-29 14:19:00', 'pro', NULL, NULL, true, NULL, false);
INSERT INTO public.tour_tournaments VALUES (3, 'Live-Test #1', 'pc', '29.03.2026', 'abgeschlossen', 3, 4, '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-03-29 15:19:28.863004', 'pro', NULL, NULL, true, NULL, false);
INSERT INTO public.tour_tournaments VALUES (4, 'ttest', 'pc', '2026-03-29', 'offen', 5, 4, '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-03-29 15:58:46.697323', 'pro', NULL, NULL, true, NULL, false);
INSERT INTO public.tour_tournaments VALUES (5, 'Players Championship 9', 'pc', '05.04.2026', 'offen', 5, 64, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.708979', 'pro', 'Phase 2 – Tactical Phase', 19, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (6, 'April Major', 'dev_major', '02.04.2026', 'offen', 5, 32, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.719472', 'development', 'Development Tour – Pre Finals', 30, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (7, 'Grand Prix (Di/Do)', 'm1', '12.04.2026', 'offen', 11, 32, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.722973', 'pro', 'Major 2 – The Grand Prix (Double In/Out)', 20, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (8, 'Players Championship 10', 'pc', '16.04.2026', 'offen', 5, 64, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.725825', 'pro', 'Haupttour – Späte Saison', 21, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (9, 'Players Championship 11', 'pc', '26.04.2026', 'offen', 5, 64, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.72866', 'pro', 'Haupttour – Späte Saison', 22, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (10, 'May Major', 'dev_major', '03.05.2026', 'offen', 5, 32, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.73229', 'development', 'Development Tour – Pre Finals', 23, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (11, 'Home Matchplay', 'm2', '10.05.2026', 'offen', 11, 32, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.735292', 'pro', 'Major 3 – Home Matchplay', 25, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (13, 'Test', 'pc', '2026-03-29', 'laufend', 5, 32, '8e9b669109df89620b94f2387dc53206a82ddc71d658f8f7a2b3a9b417370d3e', '2026-03-29 21:18:23.75801', 'pro', NULL, NULL, true, NULL, false);
INSERT INTO public.tour_tournaments VALUES (46, 'Testtesttest', 'pc', '2026-03-29', 'laufend', 5, 32, '8e9b669109df89620b94f2387dc53206a82ddc71d658f8f7a2b3a9b417370d3e', '2026-03-29 21:37:16.800127', 'pro', NULL, NULL, true, NULL, false);
INSERT INTO public.tour_tournaments VALUES (12, 'Grand Final', 'dev_final', '24.05.2026', 'offen', 5, 32, '9b9da7c712206942d8a4f83a3c1897c45852f1a1b53aba0e83a14cf43a8c6b03', '2026-03-29 18:59:05.738518', 'development', 'Development Tour – Grand Final', 24, false, NULL, false);
INSERT INTO public.tour_tournaments VALUES (79, 'Test 5', 'pc', '2026-03-30', 'laufend', 5, 32, '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-03-30 09:20:19.643599', 'pro', NULL, NULL, true, NULL, false);


--
-- Name: tour_dev_oom_standings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_dev_oom_standings_id_seq', 55, true);


--
-- Name: tour_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_entries_id_seq', 240, true);


--
-- Name: tour_matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_matches_id_seq', 104, true);


--
-- Name: tour_oom_standings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_oom_standings_id_seq', 238, true);


--
-- Name: tour_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_players_id_seq', 4, true);


--
-- Name: tour_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_schedule_id_seq', 23, true);


--
-- Name: tour_tournaments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_tournaments_id_seq', 111, true);


--
-- PostgreSQL database dump complete
--


