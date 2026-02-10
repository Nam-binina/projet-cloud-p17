--
-- PostgreSQL database dump
--

\restrict lQiS1q6WrRrjIEiEIatHU027hDl3LCZRoKfTdtP2MiQuyaq84GS96nE1BazULRd

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
\.


--
-- Data for Name: signalements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signalements (id, firebase_id, description, entreprise, "position", status, surface, budget, user_id, date, date_debut, date_fin, photos, sync_status, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_log (id, direction, entity, status, error, created_at) FROM stdin;
\.


--
-- Data for Name: sync_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_queue (id, entity, entity_id, action, payload, status, retries, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, firebase_uid, email_verified, created_at, updated_at, last_login, failed_attempts, blocked_until, role, sync_status, deleted_at) FROM stdin;
1	test.firebase@example.com	$2b$10$u9XhIj0fptMd/ynjS6hrfOFyuiZwTVWmJ56LwhhxZQwNbYafAagwW	5BweXY1oZDZkcmkm21NpIkZtUcC3	f	2026-01-20 06:22:44	2026-02-10 02:45:25.313267	2026-01-20 06:34:45	0	\N	user	SYNCED	\N
9	hasina@gmail.com	$2b$10$5iXRYbdr5qv/HVw5enkgROWq0SW/HTGDokpyJiqHDOuvI1T8spzvW	5nC55y0k9nXi7tzlCcsdKXEkKC13	f	2026-02-03 06:20:55	2026-02-10 02:45:25.340549	2026-02-03 06:35:07	0	\N	user	SYNCED	\N
2	a@a.com	$2b$10$jMoEp2qU1YqDeixqoNXFTuFU9xT4SSFaLpl3nmmHiJg0305vB45t2	7nLDHxr02aYfNfH2TO55GydkWdd2	f	2026-01-20 07:34:57	2026-02-10 02:45:25.35809	\N	3	2026-02-04 01:55:37.129	user	SYNCED	\N
10	testy@gmail.com	$2b$10$IQyKl37O.bhw4KmDz3ePSupPEf28xW3CtBjxnv/dTcK4qXuYCZS/G	AnoNn8O700W2sDQLqukNNmp00Uc2	f	2026-02-03 05:48:31	2026-02-10 02:45:25.374736	2026-02-03 09:32:28	0	\N	user	SYNCED	\N
4	admin@admin.com	$2b$10$EOIYHYG.fi9FBK8eWGWF/ugYCx.j9mG1r1DvHk8K.4ZsUf9nMCcLW	Kcaye3xTLNeaYVkWJNCLkJTgvaT2	f	2026-01-19 13:59:24	2026-02-10 02:45:25.391923	2026-02-10 01:56:07	0	\N	manager	SYNCED	\N
3	test@gmail.com	$2b$10$WaCDKjKmVlDm7pBmszMvmuXFROGJWXfCifZcUVPUXfA0HvE6E9D/a	KsjympDdpKfnTwyvtjhOnedE3ju2	f	2026-01-20 05:59:40	2026-02-10 02:45:25.409017	2026-02-03 05:44:40	0	\N	user	SYNCED	\N
5	test-hybrid-1768659709999@example.com	$2b$10$TewocL5e6wbVJVMnXWvlRO.C4MSWqLbbpD595WgiCDzY7xcFrQKp2	g78bSyeZXGVA7dMX9j2qsOe8jq92	f	2026-01-17 14:21:52	2026-02-10 02:45:25.426375	2026-01-17 14:21:52	0	\N	user	SYNCED	\N
6	tatata@gmail.com	$2b$10$E4ikLC5/L3QEamZq3UL3K.Vye9l1DXNB2kqRpEu4HYWKOq1JW/qJe	opZukWT7ELUDeX0w2fWTaREJ5Bj1	f	2026-01-17 12:14:57	2026-02-10 02:45:25.442729	2026-01-17 12:19:52	0	\N	user	SYNCED	\N
7	test1768651836@example.com	$2b$10$M6T5jlgRdhPFXCt.AHx82eD5Czf0FVg71rVkOrWoYEqwHOhLapgNO	sKId2Q3rfugZ4eg1o7lDq949GQi1	f	2026-01-17 12:10:37	2026-02-10 02:45:25.460557	2026-01-17 12:10:37	0	\N	user	SYNCED	\N
11	aina@gmail.com	$2b$10$SI46ryUe6ELyPxP/UflS8e2mve4DrMr9n7uzLioVB9ecISnmH19BK	tLhjhPd04zYKw0cspPXG9nUDvzB2	f	2026-02-03 07:15:05	2026-02-10 02:45:25.477029	2026-02-03 07:15:22	0	\N	user	SYNCED	\N
8	hasinarandria18@gmail.com	$2b$10$bLh8PP34qp/IoMQ/rElZR.E4YrJljLSNrD80Gdm/LyBSaPzLTIFAu	x5avCjFdFhMmOoPufisLQ8XXVk72	f	2026-01-27 06:52:52	2026-02-10 02:45:25.494421	2026-01-27 07:02:48	0	\N	user	SYNCED	\N
\.


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: signalements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signalements_id_seq', 1, false);


--
-- Name: sync_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_log_id_seq', 1, false);


--
-- Name: sync_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_queue_id_seq', 1, false);


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

\unrestrict lQiS1q6WrRrjIEiEIatHU027hDl3LCZRoKfTdtP2MiQuyaq84GS96nE1BazULRd

