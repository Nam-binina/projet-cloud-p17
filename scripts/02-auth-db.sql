--
-- PostgreSQL database dump
--

\restrict hcgDqGyG6tt5TmVZe3NqzMhQiSH1bjpxg7zwJImJ2Cn7aOFD089S1HJMTcGRkaW

-- Dumped from database version 15.15
-- Dumped by pg_dump version 17.7 (Debian 17.7-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_id character varying(255) NOT NULL,
    refresh_token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    revoked_at timestamp without time zone
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: signalements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signalements (
    id integer NOT NULL,
    firebase_id character varying(255),
    description text NOT NULL,
    entreprise character varying(255),
    "position" jsonb,
    status character varying(50) DEFAULT 'nouveau'::character varying,
    surface numeric(12,2) DEFAULT 0,
    budget numeric(14,2) DEFAULT 0,
    user_id character varying(255) NOT NULL,
    date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_debut timestamp without time zone,
    date_fin timestamp without time zone,
    photos jsonb DEFAULT '[]'::jsonb,
    sync_status character varying(20) DEFAULT 'SYNCED'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.signalements OWNER TO postgres;

--
-- Name: signalements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signalements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signalements_id_seq OWNER TO postgres;

--
-- Name: signalements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signalements_id_seq OWNED BY public.signalements.id;


--
-- Name: sync_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_log (
    id integer NOT NULL,
    direction character varying(10) NOT NULL,
    entity character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    error text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sync_log OWNER TO postgres;

--
-- Name: sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_log_id_seq OWNER TO postgres;

--
-- Name: sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_log_id_seq OWNED BY public.sync_log.id;


--
-- Name: sync_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_queue (
    id integer NOT NULL,
    entity character varying(50) NOT NULL,
    entity_id character varying(255) NOT NULL,
    action character varying(20) NOT NULL,
    payload jsonb NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    retries integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sync_queue OWNER TO postgres;

--
-- Name: sync_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_queue_id_seq OWNER TO postgres;

--
-- Name: sync_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_queue_id_seq OWNED BY public.sync_queue.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    firebase_uid character varying(255),
    email_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    failed_attempts integer DEFAULT 0 NOT NULL,
    blocked_until timestamp without time zone,
    role character varying(50) DEFAULT 'manager'::character varying,
    sync_status character varying(20) DEFAULT 'SYNCED'::character varying,
    deleted_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: signalements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signalements ALTER COLUMN id SET DEFAULT nextval('public.signalements_id_seq'::regclass);


--
-- Name: sync_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_log ALTER COLUMN id SET DEFAULT nextval('public.sync_log_id_seq'::regclass);


--
-- Name: sync_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue ALTER COLUMN id SET DEFAULT nextval('public.sync_queue_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token_id, refresh_token_hash, expires_at, created_at, revoked_at) FROM stdin;
1	4	3ae3303d04cb0d416f5acce864fdcb44	$2b$10$NeO/3mJDnDsj6NYDraeQ2.BKfeSiDHEE9Lhg9ZNdQwCDwyoniPXqS	2026-03-12 05:40:31.923	2026-02-10 05:40:31.924505	\N
2	4	dc8f902173dc1b78d7c61f01f56b7ad6	$2b$10$vY6BpyW2hqrO7KXbXN7Swu6pjHFbmlMxmPf5hphSPgjcrfcR13//y	2026-03-12 05:42:26.134	2026-02-10 05:42:26.134713	\N
3	4	6800b5588ca2a6328e975982dffdede4	$2b$10$.c3JPqJcu3NSNafbCEFZ.e9H4e6e.9WuGwYCzqYAFrQqsOGWfar.y	2026-03-12 05:54:29.782	2026-02-10 05:54:29.783058	\N
4	4	79d6b2d6256e8f815bbc45775cd4ccdb	$2b$10$bgI5a134Q3vyC7bPdUEPNOA9acCJHV3QOdvUslZ4en6p4JdMCroYe	2026-03-12 06:31:30.671	2026-02-10 06:31:30.672423	\N
5	4	126041d3b3b032458eeab5986f16717f	$2b$10$FUjL2NWt9/f5rRurHA.QUOcXmUiQI8mijMK6t8VOMyxzOEF5MdkPC	2026-03-12 06:32:05.69	2026-02-10 06:32:05.691702	\N
6	4	03eff7ef529848c35951fcd5805f9d8c	$2b$10$kgryA5d7T.w4BvNwygHrEe1k11sGp/y0IreR0E6S6DSvHJf3vlkvK	2026-03-12 07:05:36.884	2026-02-10 07:05:36.885204	\N
7	4	15be58fae2ba7c940ef9a80f67cb9b66	$2b$10$UODWgwV0zMBwfnrBT9FoTOQWSgOAFJkEYkAK1ShbfWGSI4DnOsMqK	2026-03-12 07:08:05.378	2026-02-10 07:08:05.378598	\N
8	4	b903135be795a13ce63a940cecfd8cd2	$2b$10$DwzeL4K3Qh8Ezc0mp8sMGOSZgGcBeWjTkxWw9/JxrLFETDWLs.ppW	2026-03-12 07:08:37.962	2026-02-10 07:08:37.962743	\N
9	4	e5daded5ad463c729d163417554510d8	$2b$10$qoV3sirqec2TCkK5oiu5qeApwRSU8yiJtMRr5xn3INAZnEb.ckSCG	2026-03-12 07:09:10.059	2026-02-10 07:09:10.060378	\N
10	4	2d2d64ae3e81979812389a358933cb2e	$2b$10$k.bMQ6x4MPbV7mE6munO0OJaBR0s4txxWcXoLKFgSTjtzdnE51ff2	2026-03-12 07:10:28.159	2026-02-10 07:10:28.161157	\N
11	4	109173f40c20fcbc9026aee6eaf1f26a	$2b$10$XfQzJKFPvpXiyACMQLishOVr1DWPeFhdEMNtcH1x8dMrSs/xx9oZK	2026-03-12 07:12:30.68	2026-02-10 07:12:30.68104	\N
12	4	9ff65a67cfb56095f3fe5875a322be98	$2b$10$9c8WwMX3dJiJNSzEQgwIjelYVexkAEB77kXO1ru1E4KoQljdtJL2O	2026-03-12 08:01:09.544	2026-02-10 08:01:09.544485	\N
\.


--
-- Data for Name: signalements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signalements (id, firebase_id, description, entreprise, "position", status, surface, budget, user_id, date, date_debut, date_fin, photos, sync_status, created_at, updated_at, deleted_at) FROM stdin;
1	0AQlP2L5XZBCUv33pvMN	123	123	{"latitude": -18.87329834969724, "longitude": 47.50556945800782}	Termine	123.00	123.00	AnoNn8O700W2sDQLqukNNmp00Uc2	2026-02-03 09:32:43.54	\N	\N	["1770704955665-route_8.jpg"]	SYNCED	2026-02-10 05:54:55.41956	2026-02-10 07:46:53.546569	\N
5	5gppPrV6xBHZGwFeKpAO	teste report	blalblalbla	{"latitude": -18.9213570154304, "longitude": 46.494140625}	Nouveau	8.00	65400.00	4	2026-02-10 06:11:38.099	\N	\N	[]	SYNCED	2026-02-10 06:11:56.605544	2026-02-10 07:46:53.590432	\N
2	e21yRQQGgBzGO6KD8MTK	pneu creuse	scia	{"latitude": -18.99109876990549, "longitude": 47.534430027008064}	Nouveau	10.00	100000.00	5nC55y0k9nXi7tzlCcsdKXEkKC13	2026-02-03 12:14:26.081	\N	\N	[]	SYNCED	2026-02-10 05:54:55.548328	2026-02-10 07:46:53.689559	\N
4	qBH5a6Nj85BlroQYBf1p	hasina	scia	{"latitude": -18.83936424079518, "longitude": 47.396392822265625}	Terminé	10.00	10100.00	5nC55y0k9nXi7tzlCcsdKXEkKC13	2026-02-10 06:04:43.312	\N	\N	[]	SYNCED	2026-02-10 06:06:45.189949	2026-02-10 07:46:53.707225	\N
3	wtH3TCvYh1rlow1zMMY2	adalkzjdlakdjalzd	SARA	{"latitude": -18.85948879423349, "longitude": 47.48479843139649}	Nouveau	10.00	10000.00	4	2026-02-10 06:04:27.633	\N	\N	["1770703542336-route_13.jpg", "1770704972513-route_5.jpg"]	SYNCED	2026-02-10 06:05:41.394676	2026-02-10 07:46:53.798377	\N
6	CW4w3sRcOCVpGigyWZbQ	test route	entrp	{"latitude": -18.88354892151392, "longitude": 47.5762939453125}	Nouveau	500.00	120000.00	Kcaye3xTLNeaYVkWJNCLkJTgvaT2	2026-02-10 07:32:06.681	\N	\N	["route_7.jpg"]	SYNCED	2026-02-10 07:46:53.615013	2026-02-10 07:47:00.989973	\N
\.


--
-- Data for Name: sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_log (id, direction, entity, status, error, created_at) FROM stdin;
1	push	signalements	SUCCESS	\N	2026-02-10 06:02:39.825156
2	push	signalements	SUCCESS	\N	2026-02-10 06:02:40.639415
3	push	signalements	SUCCESS	\N	2026-02-10 06:02:42.096022
4	push	signalements	SUCCESS	\N	2026-02-10 06:06:29.125347
5	push	signalements	SUCCESS	\N	2026-02-10 06:21:29.642387
\.


--
-- Data for Name: sync_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_queue (id, entity, entity_id, action, payload, status, retries, created_at, updated_at) FROM stdin;
1	signalements	1	UPDATE	{"id": 1, "date": "2026-02-03T09:32:43.540Z", "budget": "123.00", "photos": [], "status": "Termine", "surface": "123.00", "user_id": "AnoNn8O700W2sDQLqukNNmp00Uc2", "date_fin": null, "position": {"latitude": -18.87329834969724, "longitude": 47.50556945800782}, "created_at": "2026-02-10T05:54:55.419Z", "date_debut": null, "deleted_at": null, "entreprise": "123", "updated_at": "2026-02-10T06:01:37.833Z", "description": "123", "firebase_id": "0AQlP2L5XZBCUv33pvMN", "sync_status": "SYNCED"}	DONE	0	2026-02-10 06:01:37.933209	2026-02-10 06:02:39.79095
2	signalements	1	UPDATE	{"id": 1, "date": "2026-02-03T09:32:43.540Z", "budget": "123.00", "photos": [], "status": "En cours", "surface": "123.00", "user_id": "AnoNn8O700W2sDQLqukNNmp00Uc2", "date_fin": null, "position": {"latitude": -18.87329834969724, "longitude": 47.50556945800782}, "created_at": "2026-02-10T05:54:55.419Z", "date_debut": null, "deleted_at": null, "entreprise": "123", "updated_at": "2026-02-10T06:01:46.550Z", "description": "123", "firebase_id": "0AQlP2L5XZBCUv33pvMN", "sync_status": "SYNCED"}	DONE	0	2026-02-10 06:01:46.569294	2026-02-10 06:02:40.623268
3	signalements	1	UPDATE	{"id": 1, "date": "2026-02-03T09:32:43.540Z", "budget": "123.00", "photos": [], "status": "Termine", "surface": "123.00", "user_id": "AnoNn8O700W2sDQLqukNNmp00Uc2", "date_fin": null, "position": {"latitude": -18.87329834969724, "longitude": 47.50556945800782}, "created_at": "2026-02-10T05:54:55.419Z", "date_debut": null, "deleted_at": null, "entreprise": "123", "updated_at": "2026-02-10T06:01:50.950Z", "description": "123", "firebase_id": "0AQlP2L5XZBCUv33pvMN", "sync_status": "SYNCED"}	DONE	0	2026-02-10 06:01:50.974143	2026-02-10 06:02:42.07851
4	signalements	3	CREATE	{"id": 3, "date": "2026-02-10T06:04:27.633Z", "budget": "10000.00", "photos": [], "status": "Nouveau", "surface": "10.00", "user_id": "4", "date_fin": null, "position": {"latitude": -18.85948879423349, "longitude": 47.48479843139649}, "created_at": "2026-02-10T06:05:41.394Z", "date_debut": null, "deleted_at": null, "entreprise": "SARA", "updated_at": "2026-02-10T06:05:41.394Z", "description": "adalkzjdlakdjalzd", "firebase_id": null, "sync_status": "PENDING"}	DONE	0	2026-02-10 06:05:42.146943	2026-02-10 06:06:29.092666
5	signalements	5	CREATE	{"id": 5, "date": "2026-02-10T06:11:38.099Z", "budget": "65400.00", "photos": [], "status": "Nouveau", "surface": "8.00", "user_id": "4", "date_fin": null, "position": {"latitude": -18.9213570154304, "longitude": 46.494140625}, "created_at": "2026-02-10T06:11:56.605Z", "date_debut": null, "deleted_at": null, "entreprise": "blalblalbla", "updated_at": "2026-02-10T06:11:56.605Z", "description": "teste report", "firebase_id": null, "sync_status": "PENDING"}	DONE	0	2026-02-10 06:11:56.74534	2026-02-10 06:21:29.625741
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, firebase_uid, email_verified, created_at, updated_at, last_login, failed_attempts, blocked_until, role, sync_status, deleted_at) FROM stdin;
1	test.firebase@example.com	$2b$10$u9XhIj0fptMd/ynjS6hrfOFyuiZwTVWmJ56LwhhxZQwNbYafAagwW	5BweXY1oZDZkcmkm21NpIkZtUcC3	f	2026-01-20 06:22:44	2026-02-10 07:46:41.09182	2026-01-20 06:34:45	0	\N	user	SYNCED	\N
9	hasina@gmail.com	$2b$10$5iXRYbdr5qv/HVw5enkgROWq0SW/HTGDokpyJiqHDOuvI1T8spzvW	5nC55y0k9nXi7tzlCcsdKXEkKC13	f	2026-02-03 06:20:55	2026-02-10 07:46:41.244371	2026-02-10 06:31:50	0	\N	user	SYNCED	\N
2	a@a.com	$2b$10$jMoEp2qU1YqDeixqoNXFTuFU9xT4SSFaLpl3nmmHiJg0305vB45t2	7nLDHxr02aYfNfH2TO55GydkWdd2	f	2026-01-20 07:34:57	2026-02-10 07:46:41.26124	\N	3	\N	user	SYNCED	\N
10	testy@gmail.com	$2b$10$IQyKl37O.bhw4KmDz3ePSupPEf28xW3CtBjxnv/dTcK4qXuYCZS/G	AnoNn8O700W2sDQLqukNNmp00Uc2	f	2026-02-03 05:48:31	2026-02-10 07:46:41.278007	2026-02-03 09:32:28	0	\N	user	SYNCED	\N
3	test@gmail.com	$2b$10$WaCDKjKmVlDm7pBmszMvmuXFROGJWXfCifZcUVPUXfA0HvE6E9D/a	KsjympDdpKfnTwyvtjhOnedE3ju2	f	2026-01-20 05:59:40	2026-02-10 07:46:41.312543	2026-02-03 05:44:40	0	\N	user	SYNCED	\N
5	test-hybrid-1768659709999@example.com	$2b$10$TewocL5e6wbVJVMnXWvlRO.C4MSWqLbbpD595WgiCDzY7xcFrQKp2	g78bSyeZXGVA7dMX9j2qsOe8jq92	f	2026-01-17 14:21:52	2026-02-10 07:46:41.329608	2026-01-17 14:21:52	0	\N	user	SYNCED	\N
6	tatata@gmail.com	$2b$10$E4ikLC5/L3QEamZq3UL3K.Vye9l1DXNB2kqRpEu4HYWKOq1JW/qJe	opZukWT7ELUDeX0w2fWTaREJ5Bj1	f	2026-01-17 12:14:57	2026-02-10 07:46:41.346333	2026-01-17 12:19:52	0	\N	user	SYNCED	\N
7	test1768651836@example.com	$2b$10$M6T5jlgRdhPFXCt.AHx82eD5Czf0FVg71rVkOrWoYEqwHOhLapgNO	sKId2Q3rfugZ4eg1o7lDq949GQi1	f	2026-01-17 12:10:37	2026-02-10 07:46:41.364336	2026-01-17 12:10:37	0	\N	user	SYNCED	\N
11	aina@gmail.com	$2b$10$SI46ryUe6ELyPxP/UflS8e2mve4DrMr9n7uzLioVB9ecISnmH19BK	tLhjhPd04zYKw0cspPXG9nUDvzB2	f	2026-02-03 07:15:05	2026-02-10 07:46:41.380919	2026-02-03 07:15:22	0	\N	user	SYNCED	\N
8	hasinarandria18@gmail.com	$2b$10$bLh8PP34qp/IoMQ/rElZR.E4YrJljLSNrD80Gdm/LyBSaPzLTIFAu	x5avCjFdFhMmOoPufisLQ8XXVk72	f	2026-01-27 06:52:52	2026-02-10 07:46:41.398041	2026-01-27 07:02:48	0	\N	user	SYNCED	\N
4	admin@admin.com	$2b$10$.h2ZV7ffVwLvbT8hW9uImuT1i43OTULtXTzVd5HkMSb8CF9fT1HgO	Kcaye3xTLNeaYVkWJNCLkJTgvaT2	f	2026-01-19 13:59:24	2026-02-10 08:01:09.433333	2026-02-10 08:01:09.433333	0	\N	manager	SYNCED	\N
\.


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 12, true);


--
-- Name: signalements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signalements_id_seq', 6, true);


--
-- Name: sync_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_log_id_seq', 5, true);


--
-- Name: sync_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_queue_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: signalements signalements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signalements
    ADD CONSTRAINT signalements_pkey PRIMARY KEY (id);


--
-- Name: sync_log sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_log
    ADD CONSTRAINT sync_log_pkey PRIMARY KEY (id);


--
-- Name: sync_queue sync_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_queue
    ADD CONSTRAINT sync_queue_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_token_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_token_id ON public.sessions USING btree (token_id);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_signalements_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_deleted_at ON public.signalements USING btree (deleted_at);


--
-- Name: idx_signalements_firebase_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_firebase_id ON public.signalements USING btree (firebase_id);


--
-- Name: idx_signalements_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_status ON public.signalements USING btree (status);


--
-- Name: idx_signalements_sync_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_sync_status ON public.signalements USING btree (sync_status);


--
-- Name: idx_signalements_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_updated_at ON public.signalements USING btree (updated_at);


--
-- Name: idx_signalements_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signalements_user_id ON public.signalements USING btree (user_id);


--
-- Name: idx_sync_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_log_created_at ON public.sync_log USING btree (created_at);


--
-- Name: idx_sync_queue_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_queue_entity_id ON public.sync_queue USING btree (entity_id);


--
-- Name: idx_sync_queue_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_queue_status ON public.sync_queue USING btree (status);


--
-- Name: idx_sync_queue_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_queue_updated_at ON public.sync_queue USING btree (updated_at);


--
-- Name: idx_users_blocked_until; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_blocked_until ON public.users USING btree (blocked_until);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_firebase_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_firebase_uid ON public.users USING btree (firebase_uid);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_sync_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_sync_status ON public.users USING btree (sync_status);


--
-- Name: idx_users_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_updated_at ON public.users USING btree (updated_at);


--
-- Name: signalements trg_signalements_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_signalements_updated_at BEFORE UPDATE ON public.signalements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sync_queue trg_sync_queue_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_queue_updated_at BEFORE UPDATE ON public.sync_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- PostgreSQL database dump complete
--

\unrestrict hcgDqGyG6tt5TmVZe3NqzMhQiSH1bjpxg7zwJImJ2Cn7aOFD089S1HJMTcGRkaW

