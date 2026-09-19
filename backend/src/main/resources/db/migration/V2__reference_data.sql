-- ============================================================
-- CareerHub - reference data (skill catalogue)
-- ============================================================

INSERT INTO skill_categories (id, name, description) VALUES ('a8540ef8-9db1-4a2b-aa4b-d46abe7db3ce', 'Programming', 'Core programming languages and fundamentals');
INSERT INTO skills (id, category_id, name) VALUES ('374b00ce-d949-48fb-a843-d087e651862b', 'a8540ef8-9db1-4a2b-aa4b-d46abe7db3ce', 'Java');
INSERT INTO skills (id, category_id, name) VALUES ('6997b6d4-eed6-45c8-952a-5f5ea5e98d24', 'a8540ef8-9db1-4a2b-aa4b-d46abe7db3ce', 'Python');
INSERT INTO skills (id, category_id, name) VALUES ('da01fcc8-bdbf-4af2-94bd-1260340a9dc9', 'a8540ef8-9db1-4a2b-aa4b-d46abe7db3ce', 'C++');
INSERT INTO skills (id, category_id, name) VALUES ('66ab7b04-7a21-4cac-a1dc-733c6367bb4e', 'a8540ef8-9db1-4a2b-aa4b-d46abe7db3ce', 'JavaScript');
INSERT INTO skills (id, category_id, name) VALUES ('7c8a3c04-60b0-4fd1-adcd-149457e4cb7c', 'a8540ef8-9db1-4a2b-aa4b-d46abe7db3ce', 'TypeScript');
INSERT INTO skills (id, category_id, name) VALUES ('25aaec40-4394-4fc1-975e-a736b453a49b', 'a8540ef8-9db1-4a2b-aa4b-d46abe7db3ce', 'Go');

INSERT INTO skill_categories (id, name, description) VALUES ('ce6e47d7-b461-429b-a123-6e37038be87d', 'Frontend', 'Client side frameworks, markup and styling');
INSERT INTO skills (id, category_id, name) VALUES ('9eb69275-5403-4957-9eb3-838d31e76e5c', 'ce6e47d7-b461-429b-a123-6e37038be87d', 'React');
INSERT INTO skills (id, category_id, name) VALUES ('98688a77-7fe1-4473-a616-9f4bffc14aed', 'ce6e47d7-b461-429b-a123-6e37038be87d', 'Angular');
INSERT INTO skills (id, category_id, name) VALUES ('5df4df46-3958-464b-911f-dfbb100e1caa', 'ce6e47d7-b461-429b-a123-6e37038be87d', 'HTML5');
INSERT INTO skills (id, category_id, name) VALUES ('3cfd1217-52bf-4b62-95c0-d0c77ed78f20', 'ce6e47d7-b461-429b-a123-6e37038be87d', 'CSS3');
INSERT INTO skills (id, category_id, name) VALUES ('c5ce4c8e-0482-4aa8-9ab7-8f55504771d1', 'ce6e47d7-b461-429b-a123-6e37038be87d', 'Tailwind CSS');
INSERT INTO skills (id, category_id, name) VALUES ('9867943d-fc9b-4a8a-a136-ae3c5acece04', 'ce6e47d7-b461-429b-a123-6e37038be87d', 'Redux');

INSERT INTO skill_categories (id, name, description) VALUES ('98eef8d1-bd08-481f-82ad-2c76c117f8c7', 'Backend', 'Server side frameworks and API development');
INSERT INTO skills (id, category_id, name) VALUES ('2315e15f-4da6-4758-91d1-2336adcb42ab', '98eef8d1-bd08-481f-82ad-2c76c117f8c7', 'Spring Boot');
INSERT INTO skills (id, category_id, name) VALUES ('94b868cf-338c-462c-9a49-ff2c62b3bd71', '98eef8d1-bd08-481f-82ad-2c76c117f8c7', 'Node.js');
INSERT INTO skills (id, category_id, name) VALUES ('5a34b17b-bcc4-4de2-828a-28e6d212c12e', '98eef8d1-bd08-481f-82ad-2c76c117f8c7', 'Express.js');
INSERT INTO skills (id, category_id, name) VALUES ('5d2c63ab-59f2-452a-a094-a8523cef72be', '98eef8d1-bd08-481f-82ad-2c76c117f8c7', 'Django');
INSERT INTO skills (id, category_id, name) VALUES ('81620409-aa0b-4d52-8f4d-528245fa4339', '98eef8d1-bd08-481f-82ad-2c76c117f8c7', 'REST API');
INSERT INTO skills (id, category_id, name) VALUES ('186ffdeb-84da-48a3-8ac0-cd5df13fdd63', '98eef8d1-bd08-481f-82ad-2c76c117f8c7', 'Microservices');

INSERT INTO skill_categories (id, name, description) VALUES ('0cffa09b-2096-4453-a244-6ee173113d5b', 'Database', 'Relational and NoSQL data stores');
INSERT INTO skills (id, category_id, name) VALUES ('af8f7c82-802f-4abf-9c96-8a42f062ef4b', '0cffa09b-2096-4453-a244-6ee173113d5b', 'PostgreSQL');
INSERT INTO skills (id, category_id, name) VALUES ('36f13ead-1939-4a5f-aa04-62ac70f60d89', '0cffa09b-2096-4453-a244-6ee173113d5b', 'MySQL');
INSERT INTO skills (id, category_id, name) VALUES ('819b79dc-4442-4edf-a5c4-34fd17c11aec', '0cffa09b-2096-4453-a244-6ee173113d5b', 'MongoDB');
INSERT INTO skills (id, category_id, name) VALUES ('f8e9c5af-bf36-4481-9d8e-1f778afaf466', '0cffa09b-2096-4453-a244-6ee173113d5b', 'Redis');
INSERT INTO skills (id, category_id, name) VALUES ('396294de-efd4-47a8-8044-0c724e0e89e3', '0cffa09b-2096-4453-a244-6ee173113d5b', 'JPA / Hibernate');
INSERT INTO skills (id, category_id, name) VALUES ('6c18e6d8-a5c1-4e7b-9190-e26ca69f0ca2', '0cffa09b-2096-4453-a244-6ee173113d5b', 'SQL');

INSERT INTO skill_categories (id, name, description) VALUES ('81e4cbed-ab50-415c-b021-187463f11fa5', 'Cloud', 'Public cloud platforms and services');
INSERT INTO skills (id, category_id, name) VALUES ('bd667586-2bed-4a22-bacf-3c79c0e304b2', '81e4cbed-ab50-415c-b021-187463f11fa5', 'AWS');
INSERT INTO skills (id, category_id, name) VALUES ('064b8b82-1e2e-4135-b1b3-354fdb4085a9', '81e4cbed-ab50-415c-b021-187463f11fa5', 'Azure');
INSERT INTO skills (id, category_id, name) VALUES ('430da1c2-fa70-4319-9112-a161888c009f', '81e4cbed-ab50-415c-b021-187463f11fa5', 'Google Cloud');
INSERT INTO skills (id, category_id, name) VALUES ('ce425136-80ec-44be-ad9e-8eb791639bf4', '81e4cbed-ab50-415c-b021-187463f11fa5', 'AWS EC2');
INSERT INTO skills (id, category_id, name) VALUES ('d1febf7b-72b8-4235-bda6-7dfad1a7124c', '81e4cbed-ab50-415c-b021-187463f11fa5', 'AWS S3');

INSERT INTO skill_categories (id, name, description) VALUES ('6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'DevOps', 'Build, containerisation, orchestration and automation');
INSERT INTO skills (id, category_id, name) VALUES ('088afede-a596-4fa4-9a4b-75ffc93682e7', '6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'Docker');
INSERT INTO skills (id, category_id, name) VALUES ('e8cd4849-e512-4df6-9a4a-b8b5ea013aa8', '6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'Kubernetes');
INSERT INTO skills (id, category_id, name) VALUES ('9e8098ef-b8de-4518-bd60-dca21291798a', '6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'Helm');
INSERT INTO skills (id, category_id, name) VALUES ('d1ddb708-1c15-41bd-b286-ecb7ee892bde', '6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'Jenkins');
INSERT INTO skills (id, category_id, name) VALUES ('cbb01378-83c7-4414-a55b-6548df5930e9', '6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'GitHub Actions');
INSERT INTO skills (id, category_id, name) VALUES ('796d4343-c6cc-4a59-882f-c70e5a6a30ef', '6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'Linux');
INSERT INTO skills (id, category_id, name) VALUES ('78a4f684-8e8f-418a-ae69-1c50f3325856', '6b29a2ca-1a4f-40c5-81ce-7a399cf29ae8', 'Git');

INSERT INTO skill_categories (id, name, description) VALUES ('05e24336-9207-4323-b7a4-23872417322e', 'Testing', 'Automated and manual quality assurance');
INSERT INTO skills (id, category_id, name) VALUES ('dff0fc1d-707e-4076-b529-473bfe1673f8', '05e24336-9207-4323-b7a4-23872417322e', 'JUnit');
INSERT INTO skills (id, category_id, name) VALUES ('8626e0da-9c37-4cac-bbb3-dffeeb841643', '05e24336-9207-4323-b7a4-23872417322e', 'Selenium');
INSERT INTO skills (id, category_id, name) VALUES ('2847d09f-ae66-4c5a-83d3-263c4496a124', '05e24336-9207-4323-b7a4-23872417322e', 'Jest');
INSERT INTO skills (id, category_id, name) VALUES ('be4d87d4-cb6e-400a-a1ab-f8c85b0767e2', '05e24336-9207-4323-b7a4-23872417322e', 'Postman');

INSERT INTO skill_categories (id, name, description) VALUES ('d7f656e6-7221-4e39-aede-314e14f7d583', 'Networking', 'Protocols, routing and network security');
INSERT INTO skills (id, category_id, name) VALUES ('3e64c0cc-37bc-4340-941f-70d977b5febe', 'd7f656e6-7221-4e39-aede-314e14f7d583', 'TCP/IP');
INSERT INTO skills (id, category_id, name) VALUES ('354ddcc6-a4ac-42e5-9e49-fa4471d424f5', 'd7f656e6-7221-4e39-aede-314e14f7d583', 'HTTP/HTTPS');
INSERT INTO skills (id, category_id, name) VALUES ('1eee3a8e-78cb-451e-8507-d01c8bde365e', 'd7f656e6-7221-4e39-aede-314e14f7d583', 'DNS');
INSERT INTO skills (id, category_id, name) VALUES ('00f89581-72e6-4b91-b087-d51274852a5c', 'd7f656e6-7221-4e39-aede-314e14f7d583', 'Network Security');

INSERT INTO skill_categories (id, name, description) VALUES ('b600abbd-f701-47b9-9494-11ce222826b4', 'Soft Skills', 'Professional and interpersonal skills');
INSERT INTO skills (id, category_id, name) VALUES ('213aea5b-1109-4fed-ae36-ed3f60fa3376', 'b600abbd-f701-47b9-9494-11ce222826b4', 'Communication');
INSERT INTO skills (id, category_id, name) VALUES ('0b9b685c-f3d7-4bbc-b016-a7b192b2342e', 'b600abbd-f701-47b9-9494-11ce222826b4', 'Teamwork');
INSERT INTO skills (id, category_id, name) VALUES ('999c534c-ba73-4771-a1d7-572032f219fb', 'b600abbd-f701-47b9-9494-11ce222826b4', 'Problem Solving');
INSERT INTO skills (id, category_id, name) VALUES ('9450d5b2-1a21-4f1e-b49d-e46790c8383a', 'b600abbd-f701-47b9-9494-11ce222826b4', 'Time Management');
INSERT INTO skills (id, category_id, name) VALUES ('92d11a90-64b2-4d53-86df-06229111a0cf', 'b600abbd-f701-47b9-9494-11ce222826b4', 'Leadership');
