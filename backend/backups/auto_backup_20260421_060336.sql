--
-- PostgreSQL database dump
--

\restrict 6MZApoV7CCnUCFbe5u4yYkDOXJWdKXrfJxdGd6dybNWl61eegNfPCFvteUhZjwc

-- Dumped from database version 16.13
-- Dumped by pg_dump version 17.9 (Debian 17.9-0+deb13u1)

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _sqlx_migrations; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public._sqlx_migrations (
    version bigint NOT NULL,
    description text NOT NULL,
    installed_on timestamp with time zone DEFAULT now() NOT NULL,
    success boolean NOT NULL,
    checksum bytea NOT NULL,
    execution_time bigint NOT NULL
);


ALTER TABLE public._sqlx_migrations OWNER TO rustcms;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    username text,
    action text NOT NULL,
    resource text NOT NULL,
    resource_id text,
    details jsonb,
    ip_addr text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO rustcms;

--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event text NOT NULL,
    entity_id uuid,
    user_id uuid,
    session_id text,
    path text,
    referrer text,
    country text,
    device text,
    value double precision DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.analytics_events OWNER TO rustcms;

--
-- Name: analytics_daily; Type: VIEW; Schema: public; Owner: rustcms
--

CREATE VIEW public.analytics_daily AS
 SELECT date_trunc('day'::text, created_at) AS day,
    count(*) FILTER (WHERE (event = 'page_view'::text)) AS page_views,
    count(*) FILTER (WHERE (event = 'post_view'::text)) AS post_views,
    count(*) FILTER (WHERE (event = 'product_view'::text)) AS product_views,
    count(*) FILTER (WHERE (event = 'add_to_cart'::text)) AS add_to_carts,
    count(*) FILTER (WHERE (event = 'purchase'::text)) AS purchases,
    COALESCE(sum(value) FILTER (WHERE (event = 'purchase'::text)), (0)::double precision) AS revenue,
    count(DISTINCT session_id) AS unique_sessions
   FROM public.analytics_events
  GROUP BY (date_trunc('day'::text, created_at))
  ORDER BY (date_trunc('day'::text, created_at)) DESC;


ALTER VIEW public.analytics_daily OWNER TO rustcms;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    key_hash text NOT NULL,
    prefix text NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    last_used timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_keys OWNER TO rustcms;

--
-- Name: booking_services; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.booking_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'COP'::text NOT NULL,
    capacity integer,
    duration_min integer,
    images text[] DEFAULT '{}'::text[] NOT NULL,
    location text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT booking_services_type_check CHECK ((type = ANY (ARRAY['tour'::text, 'lodging'::text, 'restaurant'::text, 'event'::text, 'custom'::text])))
);


ALTER TABLE public.booking_services OWNER TO rustcms;

--
-- Name: booking_slots; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.booking_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    capacity integer DEFAULT 1 NOT NULL,
    booked integer DEFAULT 0 NOT NULL,
    price double precision,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.booking_slots OWNER TO rustcms;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid NOT NULL,
    slot_id uuid,
    user_id uuid,
    guest_name text,
    guest_email text,
    guest_phone text,
    quantity integer DEFAULT 1 NOT NULL,
    total double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text])))
);


ALTER TABLE public.bookings OWNER TO rustcms;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    price double precision NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart_items OWNER TO rustcms;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.carts OWNER TO rustcms;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO rustcms;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);


ALTER TABLE public.comments OWNER TO rustcms;

--
-- Name: contact_forms; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.contact_forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    fields jsonb DEFAULT '[]'::jsonb NOT NULL,
    email_to text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contact_forms OWNER TO rustcms;

--
-- Name: contact_submissions; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    data jsonb NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contact_submissions OWNER TO rustcms;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    type text DEFAULT 'percent'::text NOT NULL,
    value double precision NOT NULL,
    min_order double precision,
    max_uses integer,
    uses integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coupons_type_check CHECK ((type = ANY (ARRAY['percent'::text, 'fixed'::text])))
);


ALTER TABLE public.coupons OWNER TO rustcms;

--
-- Name: maintenance_mode; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.maintenance_mode (
    id integer DEFAULT 1 NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    message text DEFAULT 'Sitio en mantenimiento. Volvemos pronto.'::text NOT NULL,
    ends_at timestamp with time zone,
    allowed_ips text[] DEFAULT '{}'::text[],
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT single_row CHECK ((id = 1))
);


ALTER TABLE public.maintenance_mode OWNER TO rustcms;

--
-- Name: media; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    size_bytes bigint NOT NULL,
    url text NOT NULL,
    thumbnail_url text,
    alt_text character varying(500),
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);


ALTER TABLE public.media OWNER TO rustcms;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    menu_id uuid NOT NULL,
    parent_id uuid,
    label character varying(255) NOT NULL,
    url character varying(500),
    target character varying(20) DEFAULT '_self'::character varying NOT NULL,
    icon character varying(100),
    order_index integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.menu_items OWNER TO rustcms;

--
-- Name: menus; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.menus OWNER TO rustcms;

--
-- Name: newsletter_campaigns; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.newsletter_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    sent_at timestamp with time zone,
    sent_count integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.newsletter_campaigns OWNER TO rustcms;

--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    active boolean DEFAULT true NOT NULL,
    confirmed boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.newsletter_subscribers OWNER TO rustcms;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    variant_id uuid,
    name text NOT NULL,
    sku text,
    quantity integer DEFAULT 1 NOT NULL,
    price double precision NOT NULL,
    total double precision NOT NULL
);


ALTER TABLE public.order_items OWNER TO rustcms;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    total double precision DEFAULT 0 NOT NULL,
    subtotal double precision DEFAULT 0 NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    shipping double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'COP'::text NOT NULL,
    payment_method text,
    payment_ref text,
    notes text,
    shipping_addr jsonb,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text])))
);


ALTER TABLE public.orders OWNER TO rustcms;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO rustcms;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO rustcms;

--
-- Name: plugins; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.plugins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    version character varying(20) NOT NULL,
    description text,
    is_enabled boolean DEFAULT false NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    installed_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);


ALTER TABLE public.plugins OWNER TO rustcms;

--
-- Name: post_categories; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.post_categories (
    post_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.post_categories OWNER TO rustcms;

--
-- Name: post_revisions; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.post_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    title character varying(500),
    content text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.post_revisions OWNER TO rustcms;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(500) NOT NULL,
    content text,
    excerpt text,
    post_type character varying(50) DEFAULT 'post'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    author_id uuid NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    seo_title text,
    seo_description text,
    og_image text,
    language character varying(10) DEFAULT 'es'::character varying NOT NULL,
    views bigint DEFAULT 0 NOT NULL,
    publish_at timestamp with time zone,
    tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);


ALTER TABLE public.posts OWNER TO rustcms;

--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    parent_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_categories OWNER TO rustcms;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    guest_name text,
    rating integer NOT NULL,
    title text,
    body text,
    verified boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    helpful integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.reviews OWNER TO rustcms;

--
-- Name: product_ratings; Type: VIEW; Schema: public; Owner: rustcms
--

CREATE VIEW public.product_ratings AS
 SELECT product_id,
    round(avg(rating), 1) AS avg_rating,
    count(*) AS total_reviews,
    count(*) FILTER (WHERE (rating = 5)) AS five_star,
    count(*) FILTER (WHERE (rating = 4)) AS four_star,
    count(*) FILTER (WHERE (rating = 3)) AS three_star,
    count(*) FILTER (WHERE (rating = 2)) AS two_star,
    count(*) FILTER (WHERE (rating = 1)) AS one_star
   FROM public.reviews
  WHERE (status = 'approved'::text)
  GROUP BY product_id;


ALTER VIEW public.product_ratings OWNER TO rustcms;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    price double precision,
    stock integer DEFAULT 0 NOT NULL,
    attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_variants OWNER TO rustcms;

--
-- Name: products; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price double precision DEFAULT 0 NOT NULL,
    compare_price double precision,
    cost_price double precision,
    sku text,
    stock integer DEFAULT 0 NOT NULL,
    track_stock boolean DEFAULT true NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    category_id uuid,
    images jsonb NOT NULL,
    tags jsonb NOT NULL,
    weight double precision,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])))
);


ALTER TABLE public.products OWNER TO rustcms;

--
-- Name: redirects; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.redirects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_path text NOT NULL,
    to_path text NOT NULL,
    status_code integer DEFAULT 301 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    hits bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.redirects OWNER TO rustcms;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO rustcms;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO rustcms;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL,
    tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);


ALTER TABLE public.settings OWNER TO rustcms;

--
-- Name: sliders; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.sliders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    subtitle text,
    button_text character varying(100),
    button_url character varying(500),
    image_url text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sliders OWNER TO rustcms;

--
-- Name: tenant_users; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.tenant_users (
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying NOT NULL
);


ALTER TABLE public.tenant_users OWNER TO rustcms;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    domain character varying(255),
    plan character varying(50) DEFAULT 'free'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenants OWNER TO rustcms;

--
-- Name: uptime_events; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.uptime_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status character varying(10) NOT NULL,
    checked_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.uptime_events OWNER TO rustcms;

--
-- Name: users; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bio text,
    avatar text,
    website text,
    twitter text,
    github text,
    public boolean DEFAULT true NOT NULL,
    tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid
);


ALTER TABLE public.users OWNER TO rustcms;

--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: rustcms
--

CREATE TABLE public.webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    event text DEFAULT 'post.published'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    secret text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.webhooks OWNER TO rustcms;

--
-- Data for Name: _sqlx_migrations; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public._sqlx_migrations (version, description, installed_on, success, checksum, execution_time) FROM stdin;
1	schema	2026-04-05 03:31:12.292214+00	t	\\x2f097a3127fd26dd425872e9e69f3e62cd87074d8eca64a9694537859e193301455c03596ac7365d8c73d6543641f390	199042769
2	password reset tokens	2026-04-05 03:31:12.495802+00	t	\\x38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b	3016466
3	sliders	2026-04-05 03:31:12.501104+00	t	\\xef1297e62fd8ce3cf6e60a7f77b486e54269219f6e0f68057f14a49a8b46d2c6909f6564ceecd249a088a43c3a9609b9	11954010
4	menus	2026-04-05 03:31:12.515705+00	t	\\xe9616716073d9709c169b58663c72fb79ee32ba9a81139e8c6e12d76bc3a6ef2abd266a8f2145456397b2587a960a3dc	33147813
20260320000654	create settings	2026-04-05 03:31:12.551618+00	t	\\x07a7de64716118ff6e207219e312db174359ee970168cc55804abc8c1bcb86dc207d81f6851446334885b137157cbc97	8967367
20260320001025	create settings	2026-04-05 03:31:12.56293+00	t	\\x07a7de64716118ff6e207219e312db174359ee970168cc55804abc8c1bcb86dc207d81f6851446334885b137157cbc97	2853073
20260327135351	create comments	2026-04-05 03:31:12.56816+00	t	\\x6ab9ea7f62be3ef2ab5008690c3c626fc7743e0c7a33eee1b9a482b599f23484f36fc1a3a745e399c1193ef6f12a7a82	14300060
20260327184452	add seo to posts	2026-04-05 03:31:12.585112+00	t	\\x359ebb57cd1c066711e067da07de6de95bf3b81f04f815eb890b23cc6336393a6fd4ec6a4fc0e8e23798be7e7960fa70	4166282
20260328000307	add language to posts	2026-04-05 03:31:12.592238+00	t	\\xbc73ff1f5ca3075a570c73b6202e2ba0ae7d7b4f979a0b5889bed4c677d16493b53ca751cd04371ef4c02be68cc4df65	7640127
20260328143347	create categories	2026-04-05 03:31:12.602817+00	t	\\x1d4327ffbfca68ca030d36eed99d45b0a04fcecbced59b3ad2dee909add9ea3fbe8d68cf71b5db34b3e1e43832958195	20899977
20260329000909	add views to posts	2026-04-05 03:31:12.625901+00	t	\\x9c6953871b4c15f127d18ccafed698ecc0b71008aa4057885bfece5a1dfe5b113c41bcffbdd962aafde16e67a378d882	3862100
20260329144203	create webhooks	2026-04-05 03:31:12.632802+00	t	\\xccd224419ecd462706ff1c660b4d84af2f18878f03eac4399674b62359b46bdd44476f1f72a6e70e7b63b3a4e06c3eee	8860604
20260329145005	add publish at to posts	2026-04-05 03:31:12.644564+00	t	\\xf4fe7d5e2362a2d135ef8b9a812746de78f3117634b2cf0627cc7852101680cea4a85e9fff373bce94274896cdf9b971	6902005
20260331133815	create api keys	2026-04-05 03:31:12.653976+00	t	\\x3ea0824c95cc05a5b48c4104e73c88ef851941b13b872308f21be4d92f0df698f248f95c70fcfbb10b75a3815cd6aa5e	18062675
20260331134438	add author profile	2026-04-05 03:31:12.67499+00	t	\\x387023148a67768903cfcf520292e03f0c8f4be74d6c92a00056ef39353152feb15f549712099334a2fb3b7e08fad037	5962893
20260331135344	create permissions	2026-04-05 03:31:12.685338+00	t	\\xacb2548433b75fe81c9563bf5ddd269822ba848586e853218459c731c0270fe8740b03c00745347e9a64a83f271fd0f9	23207511
20260331140033	create shop	2026-04-05 03:31:12.715136+00	t	\\xbfd53e9de5e0d4bb699b701d8bd5637d6b99f08a26e22073bbe13a3883d5bbd233fec9e4314174108b5032786b37695f	54876937
20260331184734	fix product types	2026-04-05 03:31:12.773834+00	t	\\xd3d54eda0e92056b3c46cb5bd15947a1331f539e1d1573e2655fc5c44afecbdee05ce4b7cbbd7629acf56750b2ee7fe9	58166895
20260331233830	create cart orders	2026-04-05 03:31:12.835277+00	t	\\x4f6c605eb9039b0620d7046c2d542692e503d2ec279ec5e40f37db9fa66c541ed844b6cefed3e8da0f557078cfca2a28	73112053
20260331234507	create bookings	2026-04-05 03:31:12.912264+00	t	\\x1dcdb661db9a5f1fa46980d5c14c66ae9fbba1c949be79e6f366d442097dee3b2a671d8d5488d1afaf954f5903232cce	47690119
20260402032723	create reviews	2026-04-05 03:31:12.965691+00	t	\\x39d67b3ce64600b847b6871ebe2b62f7a4c4e5c99d38488cc0c624e9991dca02c04e4751986d5d2d0312609f893d1c4e	27642454
20260403034334	analytics	2026-04-05 03:31:12.996459+00	t	\\x2faf8e1c0b810b4436ed25ef04431dae80def06bffab17e9e2396ef12e901c069d74661851e532f367813733fc8509d5	29299916
20260403232327	create product variants	2026-04-05 03:31:13.029567+00	t	\\xb574a5beeb89db194d3f0775203fc3fc0d5e2bbf7088c08c578a80a8ab47721b41c6e8efa753797449cbd81f5e1fa684	3259201
20260419000001	multi tenancy	2026-04-20 06:03:35.108922+00	t	\\xf06869578fa3107bbf478a6e1e0d6fee9c83fe215cb14551df24ced096e02f1aef496218ee88f7149b68fc914bf8f1c0	223248611
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.activity_logs (id, user_id, username, action, resource, resource_id, details, ip_addr, created_at) FROM stdin;
\.


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.analytics_events (id, event, entity_id, user_id, session_id, path, referrer, country, device, value, created_at) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.api_keys (id, user_id, name, key_hash, prefix, scopes, last_used, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: booking_services; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.booking_services (id, type, name, slug, description, price, currency, capacity, duration_min, images, location, meta, active, created_at) FROM stdin;
\.


--
-- Data for Name: booking_slots; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.booking_slots (id, service_id, starts_at, ends_at, capacity, booked, price, active) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.bookings (id, service_id, slot_id, user_id, guest_name, guest_email, guest_phone, quantity, total, status, notes, meta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.cart_items (id, cart_id, product_id, variant_id, quantity, price, created_at) FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.carts (id, user_id, token, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.categories (id, name, slug, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.comments (id, post_id, author_id, content, status, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: contact_forms; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.contact_forms (id, name, slug, fields, email_to, active, created_at) FROM stdin;
\.


--
-- Data for Name: contact_submissions; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.contact_submissions (id, form_id, data, read, created_at) FROM stdin;
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.coupons (id, code, type, value, min_order, max_uses, uses, expires_at, active, created_at) FROM stdin;
\.


--
-- Data for Name: maintenance_mode; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.maintenance_mode (id, enabled, message, ends_at, allowed_ips, updated_at) FROM stdin;
1	f	Sitio en mantenimiento. Volvemos pronto.	\N	{}	2026-04-11 18:12:30.724546+00
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.media (id, filename, original_name, mime_type, size_bytes, url, thumbnail_url, alt_text, uploaded_by, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.menu_items (id, menu_id, parent_id, label, url, target, icon, order_index, is_active, created_at, updated_at) FROM stdin;
ab5ce712-3663-4aaa-a860-2e5462575a75	a1b2c3d4-0000-0000-0000-000000000001	\N	Inicio	/	_self	\N	0	t	2026-04-05 03:31:12.515705+00	2026-04-05 03:31:12.515705+00
8059d1f4-51dc-4ad6-881e-c9fd28f10a4a	a1b2c3d4-0000-0000-0000-000000000001	\N	Blog	/blog	_self	\N	1	t	2026-04-05 03:31:12.515705+00	2026-04-05 03:31:12.515705+00
5cf03f01-6c26-4087-a18b-b6f54b1a6bbc	a1b2c3d4-0000-0000-0000-000000000001	\N	Acerca de	/about	_self	\N	2	t	2026-04-05 03:31:12.515705+00	2026-04-05 03:31:12.515705+00
a2bf9e04-736c-4f28-81b5-799d75611206	a1b2c3d4-0000-0000-0000-000000000001	\N	Contacto	/contact	_self	\N	3	t	2026-04-05 03:31:12.515705+00	2026-04-05 03:31:12.515705+00
4b85b64b-f291-4abd-9a76-69103a0dd7d6	a1b2c3d4-0000-0000-0000-000000000001	\N	Inicio	/	_self	\N	0	t	2026-04-05 09:15:58.246449+00	2026-04-05 09:15:58.246449+00
88a953f9-5128-4d0e-a354-0f101a1eda35	a1b2c3d4-0000-0000-0000-000000000001	\N	Blog	/blog	_self	\N	1	t	2026-04-05 09:15:58.246449+00	2026-04-05 09:15:58.246449+00
66b0347d-6396-44bd-af3e-9b48cf65214e	a1b2c3d4-0000-0000-0000-000000000001	\N	Acerca de	/about	_self	\N	2	t	2026-04-05 09:15:58.246449+00	2026-04-05 09:15:58.246449+00
98fe954a-6cd0-47d7-ab14-d93821a26341	a1b2c3d4-0000-0000-0000-000000000001	\N	Contacto	/contact	_self	\N	3	t	2026-04-05 09:15:58.246449+00	2026-04-05 09:15:58.246449+00
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.menus (id, name, slug, description, is_active, created_at, updated_at) FROM stdin;
a1b2c3d4-0000-0000-0000-000000000001	Menú Principal	main	Navegación principal del sitio	t	2026-04-05 03:31:12.515705+00	2026-04-05 03:31:12.515705+00
\.


--
-- Data for Name: newsletter_campaigns; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.newsletter_campaigns (id, subject, body, sent_at, sent_count, status, created_at) FROM stdin;
\.


--
-- Data for Name: newsletter_subscribers; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.newsletter_subscribers (id, email, name, active, confirmed, tags, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.order_items (id, order_id, product_id, variant_id, name, sku, quantity, price, total) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.orders (id, user_id, status, total, subtotal, discount, shipping, currency, payment_method, payment_ref, notes, shipping_addr, meta, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.permissions (id, resource, action, description) FROM stdin;
c651b35b-4eda-41f2-8b6c-7b14cc6ae77f	posts	read	\N
02a777a4-5aab-41e1-8c9a-f06fc1c3563f	posts	create	\N
357f0f37-cd94-4054-a060-36805034f904	posts	update	\N
99d4b16b-4394-4f0a-a9f1-df50aa23547d	posts	delete	\N
601df849-a90b-4a51-8293-d7048618b9f8	posts	publish	\N
ca9f2c8d-7131-41b4-8c85-80bdf5b9adba	media	read	\N
0f0a86e6-cbeb-4189-a179-dc2804cf98d5	media	upload	\N
4591862f-2b6a-4e23-8540-17e0df49b448	media	delete	\N
ca1cd443-46f9-4c99-be27-ba683a8fe513	users	read	\N
b4f58515-f8b3-401a-945c-5cefc72b7a8a	users	create	\N
dfd6c0cb-8c3e-46a1-9954-8b5c899f9841	users	update	\N
f727cf89-fb8a-4655-86b0-c7e6366115c0	users	delete	\N
0cf90f16-fc02-479b-b055-f8aa92c36c2f	settings	read	\N
b1fe762d-9676-45e2-a848-65c1d855f2bc	settings	update	\N
73b06dfb-16b8-40b3-967b-88bb1cf697d9	webhooks	manage	\N
dad3a726-c92f-4b37-a616-1d0d8eccda33	api_keys	manage	\N
\.


--
-- Data for Name: plugins; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.plugins (id, name, version, description, is_enabled, config, installed_at, tenant_id) FROM stdin;
31862622-8451-407a-bc53-2243e4b327a6	sliders	1.0.0	Carrusel de imágenes para la página principal.	t	{"icon": "SlidersHorizontal", "color": "from-blue-500/20 to-blue-600/5 border-blue-500/20", "title": "Home Sliders", "category": "content"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
7379f05b-54ca-4a32-a1f8-70518f2b5754	menus	1.0.0	Constructor de menús de navegación.	t	{"icon": "Navigation", "color": "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20", "title": "Menús", "category": "content"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
3c48650e-61b9-431f-88eb-bc49e6c9b17e	comments	1.0.0	Modera comentarios de lectores.	t	{"icon": "MessageSquare", "color": "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20", "title": "Comentarios", "category": "content"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
28c7c916-62c0-494a-9937-4edf2dace691	categories	1.0.0	Organiza posts con categorías y tags.	t	{"icon": "Tag", "color": "from-orange-500/20 to-orange-600/5 border-orange-500/20", "title": "Categorías", "category": "content"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
234e2f73-ec02-4246-af2d-2ef3a52551b0	webhooks	1.0.0	Notifica a Slack, Discord y otros al publicar.	t	{"icon": "Webhook", "color": "from-pink-500/20 to-pink-600/5 border-pink-500/20", "title": "Webhooks", "category": "integrations"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
2a934363-d33e-492f-ac3d-d59a1a3c5f2b	health	1.0.0	Monitorea el estado del servidor.	t	{"icon": "Activity", "color": "from-gray-500/20 to-gray-600/5 border-gray-500/20", "title": "Healthcheck", "category": "system"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
891cb9af-d4e9-4204-b35c-d9bec51b48fe	ecommerce	1.0.0	Productos, pedidos, clientes, cupones e inventario.	t	{"icon": "ShoppingBag", "badge": "Activo", "color": "from-violet-500/20 to-violet-600/5 border-violet-500/20", "title": "Tienda / Ecommerce", "category": "ecommerce"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
bfb61ef6-6f66-44ac-ac68-45fcb5a914f3	backup	1.0.0	Copia de seguridad completa de DB y archivos.	t	{"icon": "HardDrive", "color": "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20", "title": "Backup & Restore", "category": "system"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
f8224e9e-0fa0-4909-8396-02aa13a863c5	updates	1.0.0	Verifica y aplica nuevas versiones del CMS.	t	{"icon": "RefreshCw", "color": "from-teal-500/20 to-teal-600/5 border-teal-500/20", "title": "Actualizaciones", "category": "system"}	2026-04-06 11:32:21.69257+00	00000000-0000-0000-0000-000000000001
4065637e-aa48-49df-bceb-917a10d10448	redirects	1.0.0	Gestiona redirecciones 301 y 302 desde el admin	t	{"icon": "ExternalLink", "color": "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20", "title": "Redirecciones", "category": "system"}	2026-04-11 04:09:50.529329+00	00000000-0000-0000-0000-000000000001
92c1df1a-5068-4feb-bc7a-a99ad01cff7b	newsletter	1.0.0	Gestiona suscriptores y envia campanas de email masivo	t	{"icon": "Mail", "color": "from-violet-500/20 to-violet-600/5 border-violet-500/20", "title": "Newsletter", "category": "integrations"}	2026-04-11 04:16:03.138428+00	00000000-0000-0000-0000-000000000001
33c6310f-5a1b-4db7-9117-98de2a26f993	contact	1.0.0	Constructor de formularios de contacto con bandeja de mensajes	t	{"icon": "MessageSquare", "color": "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20", "title": "Formularios", "category": "content"}	2026-04-11 13:25:55.606397+00	00000000-0000-0000-0000-000000000001
67adcefc-0d75-44ee-9c29-4046e20df37c	coupons	1.0.0	Cupones de descuento por porcentaje o monto fijo para la tienda	t	{"icon": "Tag", "color": "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20", "title": "Cupones", "category": "ecommerce"}	2026-04-11 13:33:44.080603+00	00000000-0000-0000-0000-000000000001
872e8fd6-e3fb-448a-8464-4075c9510885	cache	1.0.0	Panel de administracion del cache Redis con estadisticas y limpieza por prefijo	t	{"icon": "Zap", "color": "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20", "title": "Cache Redis", "category": "system"}	2026-04-11 18:03:31.995063+00	00000000-0000-0000-0000-000000000001
554771dd-1267-4fc1-b5b2-4c9cb96461f3	csv	1.0.0	Exporta productos, posts y suscriptores a CSV. Importa productos en bulk.	t	{"icon": "FileText", "color": "from-teal-500/20 to-teal-600/5 border-teal-500/20", "title": "CSV Import/Export", "category": "system"}	2026-04-11 18:09:30.0147+00	00000000-0000-0000-0000-000000000001
75fe8008-c3ec-43d1-b936-515e2d78f549	maintenance	1.0.0	Modo mantenimiento con mensaje personalizable, countdown y whitelist de IPs	t	{"icon": "Shield", "color": "from-red-500/20 to-red-600/5 border-red-500/20", "title": "Mantenimiento", "category": "system"}	2026-04-12 00:14:10.545309+00	00000000-0000-0000-0000-000000000001
86329a44-8ed1-4b29-98d1-ca49fbbb2ad3	gallery	1.0.0	Galeria de medios con grid, lightbox, drag and drop y vista lista	t	{"icon": "Image", "color": "from-pink-500/20 to-pink-600/5 border-pink-500/20", "title": "Galeria", "category": "content"}	2026-04-12 05:25:03.186471+00	00000000-0000-0000-0000-000000000001
4d8d3b18-3357-4fc9-9c1b-998aedc924d9	roles	1.0.0	Gestion de roles y permisos, asignacion de roles a usuarios	t	{"icon": "Shield", "color": "from-red-500/20 to-red-600/5 border-red-500/20", "title": "Roles", "category": "system"}	2026-04-12 05:31:16.563299+00	00000000-0000-0000-0000-000000000001
5f394186-2d13-4a81-bb5e-1580b1c89499	activity	1.0.0	Log de actividad del sistema con filtros por recurso y paginacion	t	{"icon": "Activity", "color": "from-slate-500/20 to-slate-600/5 border-slate-500/20", "title": "Actividad", "category": "system"}	2026-04-12 05:35:39.188991+00	00000000-0000-0000-0000-000000000001
35fa6b92-497c-4b03-8aa0-e0e363e82518	whatsapp-button	1.0.0	Botón flotante de WhatsApp configurable	t	{"icon": "MessageCircle", "color": "from-green-500/20 to-green-600/5 border-green-500/20", "title": "WhatsApp Button", "category": "integrations"}	2026-04-18 22:36:14.778705+00	00000000-0000-0000-0000-000000000001
9c725a8d-4d20-4258-a7c8-aa110d804151	map-location	1.0.0	Mapa de ubicación del negocio con OpenStreetMap	t	{"icon": "MapPin", "color": "from-blue-500/20 to-blue-600/5 border-blue-500/20", "title": "Mapa", "category": "integrations"}	2026-04-18 22:40:12.72199+00	00000000-0000-0000-0000-000000000001
b903d0c3-c792-4452-a96e-89e5dcc83f0c	uptime-monitor	1.0.0	Monitor de uptime con historial de checks	t	{"icon": "Activity", "color": "from-green-500/20 to-green-600/5 border-green-500/20", "title": "Uptime Monitor", "category": "system"}	2026-04-19 04:16:18.58806+00	00000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: post_categories; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.post_categories (post_id, category_id) FROM stdin;
\.


--
-- Data for Name: post_revisions; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.post_revisions (id, post_id, title, content, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.posts (id, title, slug, content, excerpt, post_type, status, author_id, meta, published_at, created_at, updated_at, seo_title, seo_description, og_image, language, views, publish_at, tenant_id) FROM stdin;
b6b623b9-fb86-4ac1-9064-79cde0418e6e	Bienvenido a RustCMS	bienvenido-a-rustcms	# Bienvenido a RustCMS\n\nCMS moderno construido con Rust y React. Rápido, seguro y completo.	Primer post de RustCMS.	post	published	545f47d2-fae1-424b-91cd-38b21166de03	{}	2026-04-05 08:46:43.90027+00	2026-04-05 08:46:43.90027+00	2026-04-05 08:46:43.90027+00	\N	\N	\N	es	0	\N	00000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.product_categories (id, name, slug, description, image, parent_id, sort_order, created_at) FROM stdin;
1cd60022-a145-4ca7-8cad-f1aebcc2f481	Monitores	monitores	Monitores y pantallas	\N	\N	0	2026-04-06 04:15:49.692161+00
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.product_variants (id, product_id, name, sku, price, stock, attributes, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.products (id, name, slug, description, price, compare_price, cost_price, sku, stock, track_stock, status, category_id, images, tags, weight, created_at, updated_at) FROM stdin;
bd21aaa3-4d96-499d-bffa-d8615f0f7927	Teclado Mecánico Keychron K2	teclado-mecanico-keychron-k2	Teclado mecánico inalámbrico, switches Red, RGB	389900	\N	\N	\N	25	t	active	\N	["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
4181c0a4-9152-42b2-ab76-19faee2d8c3b	Mouse Logitech MX Master 3	mouse-logitech-mx-master-3	Mouse ergonómico inalámbrico, 4000 DPI	299900	\N	\N	\N	30	t	active	\N	["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
f9a9c23d-1cdc-4033-9ca8-e5b13a9380d8	SSD Samsung 990 Pro 1TB	ssd-samsung-990-pro-1tb	SSD NVMe PCIe 4.0, 7450 MB/s lectura	459900	\N	\N	\N	50	t	active	\N	["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
143aa3ae-99e7-4a98-bffc-80d0eb1babc2	Tarjeta Gráfica RTX 4070	tarjeta-grafica-rtx-4070	GPU NVIDIA RTX 4070, 12GB GDDR6X, DLSS 3	2199900	\N	\N	\N	8	t	active	\N	["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
be68c1b0-9495-450a-9b9f-2453143517b9	RAM Corsair Vengeance 32GB DDR5	ram-corsair-vengeance-32gb-ddr5	Kit 2x16GB DDR5 5600MHz, CL36	549900	\N	\N	\N	20	t	active	\N	["https://images.unsplash.com/photo-1562976540-1502c2145851?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
8f182225-b02a-48a0-a880-4731a5097e33	Procesador AMD Ryzen 9 7900X	procesador-amd-ryzen-9-7900x	12 núcleos, 24 hilos, hasta 5.6GHz, socket AM5	1099900	\N	\N	\N	15	t	active	\N	["https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
3078e8ba-2672-4aa3-a151-7d0dba1f699f	Motherboard ASUS ROG Strix X670E	motherboard-asus-rog-strix-x670e	AM5, DDR5, PCIe 5.0, WiFi 6E	899900	\N	\N	\N	12	t	active	\N	["https://images.unsplash.com/photo-1518770660439-4636190af475?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
25c6e0bc-9627-4b15-9a60-54a5bd69cb8d	Fuente Corsair RM850x	fuente-corsair-rm850x	850W 80+ Gold, modular, silenciosa	429900	\N	\N	\N	18	t	active	\N	["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
94a18ecd-cf39-4611-b804-0ee99b7cd214	Case NZXT H510 Flow	case-nzxt-h510-flow	Torre media ATX, vidrio templado, flujo optimizado	359900	\N	\N	\N	22	t	active	\N	["https://images.unsplash.com/photo-1593640408182-31c228814998?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-05 08:46:43.835691+00
73002401-82e1-4827-be85-f80490dd0d21	Monitor LG UltraWide 34"	monitor-lg-ultrawide-34	Monitor curvo ultrawide 34", 3440x1440, 144Hz	1299900	\N	\N	\N	10	t	active	\N	["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"]	[]	\N	2026-04-05 08:46:43.835691+00	2026-04-07 04:26:35.329138+00
\.


--
-- Data for Name: redirects; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.redirects (id, from_path, to_path, status_code, active, hits, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.reviews (id, product_id, user_id, guest_name, rating, title, body, verified, status, helpful, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.roles (id, name, permissions, created_at, description) FROM stdin;
affefd53-fc5c-4ee1-99f4-1880a31accbd	admin	["posts:read", "posts:write", "posts:delete", "media:upload", "media:delete", "users:read", "users:write", "plugins:manage"]	2026-04-05 03:31:12.292214+00	Acceso total al sistema
3b06a481-c07d-4ec7-ac8e-aea5d6f19f8b	editor	["posts:read", "posts:write", "media:upload", "media:delete"]	2026-04-05 03:31:12.292214+00	Puede crear y editar posts propios
bddb6f01-c630-4fd7-b0c2-8f73760a6247	author	["posts:read", "posts:write", "media:upload"]	2026-04-05 03:31:12.292214+00	Puede crear posts, no puede publicar
0b60c63b-5b45-4c34-afb9-18387dbe8ae7	viewer	["posts:read"]	2026-04-05 03:31:12.292214+00	Solo lectura
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.settings (key, value, tenant_id) FROM stdin;
\.


--
-- Data for Name: sliders; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.sliders (id, title, subtitle, button_text, button_url, image_url, order_index, is_active, created_at, updated_at) FROM stdin;
35a4376b-912d-408b-9fcd-73326d26b857	Gestión de Contenido	Administra tus posts, medios y usuarios fácilmente	Ver más	/posts	/uploads/slider/slide2.jpg	1	t	2026-04-05 09:15:58.069514+00	2026-04-05 09:15:58.069514+00
01eaa9e0-f7f8-4209-9140-8f9c12865eba	Bienvenido a RustCMS	El CMS más rápido construido con Rust	Comenzar	/blog	/uploads/slider/slide1.jpg	0	f	2026-04-05 03:31:12.501104+00	2026-04-06 21:12:23.765639+00
41c1d50b-13dd-41fd-a837-9f4063a64b67	Bienvenido a RustCMS	El CMS más rápido construido con Rust	Comenzar	/blog	/uploads/slider/slide1.jpg	0	f	2026-04-05 09:15:58.069514+00	2026-04-06 21:12:24.653097+00
715326ea-daea-47c2-af28-d214fcdcb2a5	Potenciado por Rust	Rendimiento, seguridad y confiabilidad	Documentación	/docs	/uploads/slider/slide2.jpg	2	t	2026-04-05 03:31:12.501104+00	2026-04-05 03:31:12.501104+00
2af5774f-b34d-4367-9267-4430da8fa198	Potenciado por Rust	Rendimiento, seguridad y confiabilidad	Documentación	/docs	/uploads/slider/slide2.jpg	2	t	2026-04-05 09:15:58.069514+00	2026-04-05 09:15:58.069514+00
031d6b24-7f1a-4879-aa17-dacd8fb26b99	Gestión de Contenido	Administra tus posts, medios y usuarios fácilmente	Ver más	/posts	/uploads/slider/slide3.jpg	1	t	2026-04-05 03:31:12.501104+00	2026-04-05 03:31:12.501104+00
\.


--
-- Data for Name: tenant_users; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.tenant_users (tenant_id, user_id, role) FROM stdin;
00000000-0000-0000-0000-000000000001	545f47d2-fae1-424b-91cd-38b21166de03	owner
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.tenants (id, name, slug, domain, plan, is_active, settings, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	Default	default	\N	pro	t	{}	2026-04-20 01:43:31.557667+00	2026-04-20 01:43:31.557667+00
\.


--
-- Data for Name: uptime_events; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.uptime_events (id, status, checked_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.users (id, username, email, password, role_id, is_active, created_at, updated_at, bio, avatar, website, twitter, github, public, tenant_id) FROM stdin;
545f47d2-fae1-424b-91cd-38b21166de03	admin	johan@rustcms.dev	$2b$12$8rFL1IrzVlQUrvOfP6IFEu8rlH9.NCgzLZCIgXsQGcB/rZFFHdSiO	affefd53-fc5c-4ee1-99f4-1880a31accbd	t	2026-04-05 03:34:32.619482+00	2026-04-05 03:34:32.619482+00	\N	\N	\N	\N	\N	t	00000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: rustcms
--

COPY public.webhooks (id, name, url, event, active, secret, created_at) FROM stdin;
\.


--
-- Name: _sqlx_migrations _sqlx_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public._sqlx_migrations
    ADD CONSTRAINT _sqlx_migrations_pkey PRIMARY KEY (version);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: booking_services booking_services_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_pkey PRIMARY KEY (id);


--
-- Name: booking_services booking_services_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_slug_key UNIQUE (slug);


--
-- Name: booking_slots booking_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.booking_slots
    ADD CONSTRAINT booking_slots_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_cart_id_product_id_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_product_id_variant_id_key UNIQUE (cart_id, product_id, variant_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: carts carts_token_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_token_key UNIQUE (token);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: contact_forms contact_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.contact_forms
    ADD CONSTRAINT contact_forms_pkey PRIMARY KEY (id);


--
-- Name: contact_forms contact_forms_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.contact_forms
    ADD CONSTRAINT contact_forms_slug_key UNIQUE (slug);


--
-- Name: contact_submissions contact_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: maintenance_mode maintenance_mode_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.maintenance_mode
    ADD CONSTRAINT maintenance_mode_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: menus menus_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_slug_key UNIQUE (slug);


--
-- Name: newsletter_campaigns newsletter_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.newsletter_campaigns
    ADD CONSTRAINT newsletter_campaigns_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_resource_action_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_resource_action_key UNIQUE (resource, action);


--
-- Name: plugins plugins_name_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_name_key UNIQUE (name);


--
-- Name: plugins plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_pkey PRIMARY KEY (id);


--
-- Name: post_categories post_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.post_categories
    ADD CONSTRAINT post_categories_pkey PRIMARY KEY (post_id, category_id);


--
-- Name: post_revisions post_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.post_revisions
    ADD CONSTRAINT post_revisions_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_key UNIQUE (slug);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_slug_key UNIQUE (slug);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_sku_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: redirects redirects_from_path_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_from_path_key UNIQUE (from_path);


--
-- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: sliders sliders_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.sliders
    ADD CONSTRAINT sliders_pkey PRIMARY KEY (id);


--
-- Name: tenant_users tenant_users_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.tenant_users
    ADD CONSTRAINT tenant_users_pkey PRIMARY KEY (tenant_id, user_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: uptime_events uptime_events_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.uptime_events
    ADD CONSTRAINT uptime_events_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_logs_created; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_activity_logs_created ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_logs_user; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_activity_logs_user ON public.activity_logs USING btree (user_id);


--
-- Name: idx_ae_created; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_ae_created ON public.analytics_events USING btree (created_at DESC);


--
-- Name: idx_ae_entity; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_ae_entity ON public.analytics_events USING btree (entity_id);


--
-- Name: idx_ae_event; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_ae_event ON public.analytics_events USING btree (event);


--
-- Name: idx_ae_session; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_ae_session ON public.analytics_events USING btree (session_id);


--
-- Name: idx_api_keys_prefix; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_api_keys_prefix ON public.api_keys USING btree (prefix);


--
-- Name: idx_api_keys_user_id; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_api_keys_user_id ON public.api_keys USING btree (user_id);


--
-- Name: idx_booking_slots_service; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_booking_slots_service ON public.booking_slots USING btree (service_id);


--
-- Name: idx_booking_slots_starts; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_booking_slots_starts ON public.booking_slots USING btree (starts_at);


--
-- Name: idx_bookings_service; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_bookings_service ON public.bookings USING btree (service_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);


--
-- Name: idx_cart_items_cart; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_cart_items_cart ON public.cart_items USING btree (cart_id);


--
-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--
-- Name: idx_comments_status; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_comments_status ON public.comments USING btree (status);


--
-- Name: idx_comments_tenant; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_comments_tenant ON public.comments USING btree (tenant_id);


--
-- Name: idx_media_mime; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_media_mime ON public.media USING btree (mime_type);


--
-- Name: idx_media_tenant; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_media_tenant ON public.media USING btree (tenant_id);


--
-- Name: idx_media_uploaded_by; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_media_uploaded_by ON public.media USING btree (uploaded_by);


--
-- Name: idx_menu_items_menu_id; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_menu_items_menu_id ON public.menu_items USING btree (menu_id);


--
-- Name: idx_menu_items_order; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_menu_items_order ON public.menu_items USING btree (menu_id, order_index);


--
-- Name: idx_menu_items_parent_id; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_menu_items_parent_id ON public.menu_items USING btree (parent_id);


--
-- Name: idx_menus_slug; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_menus_slug ON public.menus USING btree (slug);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_plugins_tenant; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_plugins_tenant ON public.plugins USING btree (tenant_id);


--
-- Name: idx_post_categories_category_id; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_post_categories_category_id ON public.post_categories USING btree (category_id);


--
-- Name: idx_post_categories_post_id; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_post_categories_post_id ON public.post_categories USING btree (post_id);


--
-- Name: idx_posts_author; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_author ON public.posts USING btree (author_id);


--
-- Name: idx_posts_language; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_language ON public.posts USING btree (language);


--
-- Name: idx_posts_publish_at; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_publish_at ON public.posts USING btree (publish_at) WHERE ((status)::text = 'draft'::text);


--
-- Name: idx_posts_published; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_published ON public.posts USING btree (published_at) WHERE ((status)::text = 'published'::text);


--
-- Name: idx_posts_slug; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);


--
-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--
-- Name: idx_posts_tenant; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_tenant ON public.posts USING btree (tenant_id);


--
-- Name: idx_posts_type; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_posts_type ON public.posts USING btree (post_type);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- Name: idx_reviews_status; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_reviews_status ON public.reviews USING btree (status);


--
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- Name: idx_settings_tenant; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_settings_tenant ON public.settings USING btree (tenant_id);


--
-- Name: idx_sliders_order; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_sliders_order ON public.sliders USING btree (order_index, is_active);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_tenant; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_variants_product; Type: INDEX; Schema: public; Owner: rustcms
--

CREATE INDEX idx_variants_product ON public.product_variants USING btree (product_id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: analytics_events analytics_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: booking_slots booking_slots_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.booking_slots
    ADD CONSTRAINT booking_slots_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.booking_services(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.booking_services(id);


--
-- Name: bookings bookings_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.booking_slots(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: contact_submissions contact_submissions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.contact_forms(id) ON DELETE CASCADE;


--
-- Name: media media_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: media media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: menu_items menu_items_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: plugins plugins_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: post_categories post_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.post_categories
    ADD CONSTRAINT post_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: post_categories post_categories_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.post_categories
    ADD CONSTRAINT post_categories_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_revisions post_revisions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.post_revisions
    ADD CONSTRAINT post_revisions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: post_revisions post_revisions_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.post_revisions
    ADD CONSTRAINT post_revisions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: product_categories product_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: settings settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_users tenant_users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.tenant_users
    ADD CONSTRAINT tenant_users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_users tenant_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.tenant_users
    ADD CONSTRAINT tenant_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rustcms
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6MZApoV7CCnUCFbe5u4yYkDOXJWdKXrfJxdGd6dybNWl61eegNfPCFvteUhZjwc

