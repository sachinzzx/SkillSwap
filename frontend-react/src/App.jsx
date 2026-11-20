import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight, BarChart3, BookOpen, Check, ChevronRight, CircleDollarSign,
  MessageCircle, Moon, Plus, Search, Send, Star, Sun, Trash2, Users, Wallet,
  X,
} from "lucide-react";
import { apiRequest, clearAuth, saveAuth, state } from "./api";

const TABS = [
  ["skills", "Skills & Ledger", BookOpen],
  ["match", "Match & Swap", ArrowLeftRight],
  ["sessions", "Sessions", Users],
  ["chat", "Chat & Notes", MessageCircle],
  ["analytics", "Analytics", BarChart3],
];

function initials(name = "") {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function AuthView({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (mode === "register") {
        await apiRequest("/auth/register", {
          method: "POST",
          body: {
            name: String(form.get("name") || "").trim(),
            email: String(form.get("email") || "").trim(),
            password: String(form.get("password") || ""),
          },
        });
        toast.success("Account created");
      }
      const login = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: String(form.get("email") || "").trim(),
          password: String(form.get("password") || ""),
        },
      });
      saveAuth(login.accessToken, login.refreshToken, login.user);
      onAuthenticated(login.user);
      toast.success("Welcome to SkillSwap");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-hero animate-rise">
        <span className="sticker-float sticker-guitar">Guitar · 12 SC</span>
        <span className="sticker-float sticker-python">Python ↔ Spanish</span>
        <span className="sticker-float sticker-welcome">+50 SC welcome</span>
        <p className="eyebrow">Peer-to-peer learning</p>
        <h1>Teach what you know.<br /><span className="highlight">Learn</span> what you <span className="text-stroke">need.</span></h1>
        <p className="hero-copy">Earn SkillCoins by teaching, spend them to learn, or swap skills directly with zero coins.</p>
      </section>
      <section className="panel auth-card animate-rise">
        <div className="auth-tabs">
          {["login", "register"].map((item) => (
            <button key={item} type="button" className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
              {item === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <div className="field"><label className="label" htmlFor="auth-name">Name</label><input id="auth-name" name="name" className="input" required placeholder="Your name" /></div>
          )}
          <div className="field"><label className="label" htmlFor="auth-email">Email</label><input id="auth-email" name="email" type="email" className="input" required placeholder="you@example.com" /></div>
          <div className="field"><label className="label" htmlFor="auth-password">Password</label><input id="auth-password" name="password" type="password" className="input" required minLength={6} placeholder="Enter your password" /></div>
          {mode === "register" && <div className="welcome-banner">Get 50 free SkillCoins on signup!</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
      </section>
    </main>
  );
}

function Header({ user, balance, tab, setTab, onLogout, dark, setDark }) {
  return (
    <>
      <header className="global-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => setTab("skills")}>
            <span className="brand-mark"><span /></span><span className="brand-name">SkillSwap</span>
          </button>
          <div className="header-actions">
            {user?.role === "ADMIN" && <span className="sticker">Admin</span>}
            <span className="header-name">{user?.name || "Learner"}</span>
            <span className="coin-wallet"><span className="mini-coin" /><strong>{balance}</strong><small>SC</small></span>
            <button className="icon-button" type="button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn btn-ghost btn-sm logout-button" type="button" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </header>
      <div className="marquee" aria-hidden="true"><div className="marquee-track">{[0, 1].map((round) => <div key={round} className="marquee-group">{["Python", "Guitar", "Spanish", "Baking", "Yoga", "Photography", "JavaScript", "Piano"].map((word) => <span key={word}>{word}<b>✦</b></span>)}</div>)}</div></div>
    </>
  );
}

function SkillsTab({ user, balance, refreshBalance }) {
  const [mine, setMine] = useState({ teaching: [], learning: [] });
  const [skills, setSkills] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [type, setType] = useState("TEACH");
  const [skillId, setSkillId] = useState("");
  const [rate, setRate] = useState(10);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [mineData, skillsData, ledgerData] = await Promise.all([
      apiRequest("/users/me/skills"),
      apiRequest("/skills"),
      apiRequest("/coins/history"),
    ]);
    setMine(mineData);
    setSkills(skillsData);
    setLedger(ledgerData);
  }
  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);

  async function addSkill(event) {
    event.preventDefault();
    if (!skillId) return toast.error("Select a skill");
    setBusy(true);
    try {
      await apiRequest("/users/skills", { method: "POST", body: { skillId: Number(skillId), type, hourlyCoinRate: type === "TEACH" ? Number(rate) : 0 } });
      toast.success("Skill added");
      setSkillId("");
      await Promise.all([load(), refreshBalance()]);
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }
  async function removeSkill(id) {
    try {
      await apiRequest(`/users/skills/${id}`, { method: "DELETE" });
      toast.success("Skill removed");
      await load();
    } catch (error) { toast.error(error.message); }
  }

  const SkillList = ({ items, teaching }) => items.length ? (
    <div className="chip-list">{items.map((item) => (
      <span key={item.id} className={`chip ${teaching ? "chip-lime" : "chip-blue"}`}>
        {item.skill?.name || "Skill"}
        {teaching && <b>{item.hourlyCoinRate} SC/hr</b>}
        <button type="button" onClick={() => removeSkill(item.id)} aria-label="Remove"><X size={13} /></button>
      </span>
    ))}</div>
  ) : <div className="empty"><strong>{teaching ? "Nothing taught yet" : "Nothing on your wishlist"}</strong><span>{teaching ? "Add a skill you can teach" : "Add what you want to learn"}</span></div>;

  return (
    <div className="grid-two">
      <article className="panel">
        <p className="eyebrow">Your profile</p><h2 className="title">My skills</h2>
        <div className="two-columns">
          <section><h3>Skills I teach</h3><SkillList items={mine.teaching || []} teaching /></section>
          <section><h3>Skills I want to learn</h3><SkillList items={mine.learning || []} teaching={false} /></section>
        </div>
        <form onSubmit={addSkill} className="skill-form">
          <div className="field"><label className="label" htmlFor="skill-select">Skill</label><select id="skill-select" className="input" value={skillId} onChange={(e) => setSkillId(e.target.value)}><option value="">Select a skill</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name} ({skill.level?.toLowerCase()})</option>)}</select></div>
          <div className="segmented"><button type="button" className={type === "TEACH" ? "active" : ""} onClick={() => setType("TEACH")}>Teach</button><button type="button" className={type === "LEARN" ? "active" : ""} onClick={() => setType("LEARN")}>Learn</button></div>
          {type === "TEACH" && <div className="field"><label className="label" htmlFor="skill-rate">SC/hour</label><input id="skill-rate" className="input" type="number" min="1" value={rate} onChange={(e) => setRate(e.target.value)} /></div>}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Adding..." : "+ Add"}</button>
        </form>
      </article>
      <div className="stack">
        <article className="panel panel-butter wallet-hero"><span className="coin coin-xl" /><div><p className="wallet-number">{balance}</p><p className="eyebrow">SkillCoins available</p></div></article>
        <article className="panel"><p className="eyebrow">Wallet activity</p><h2 className="title">Coin ledger</h2>{ledger.length ? ledger.map((tx) => {
          const credit = tx.direction === "CREDIT";
          const counterparty = credit ? tx.sender?.name : tx.receiver?.name;
          return <div className="tape-row" key={tx.id}><div><strong>{credit ? "From " : "To "}{counterparty || "User"}</strong><small>{tx.reason || "SkillCoin transfer"} · {new Date(tx.createdAt).toLocaleDateString()}</small></div><strong className={credit ? "plus" : "minus"}>{credit ? "+" : "-"}{tx.amount}</strong></div>;
        }) : <div className="empty"><strong>No coin transactions yet</strong><span>Complete a session to see coins move.</span></div>}</article>
      </div>
    </div>
  );
}

function MatchTab({ onPrefill }) {
  const [skills, setSkills] = useState([]);
  const [skillId, setSkillId] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [teachers, setTeachers] = useState(null);
  const [swaps, setSwaps] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { apiRequest("/skills").then(setSkills).catch((error) => toast.error(error.message)); }, []);

  async function searchTeachers(event) {
    event.preventEvent && event.preventEvent();
    event.preventDefault();
    if (!skillId) return toast.error("Select a skill");
    setBusy(true);
    try {
      const params = new URLSearchParams({ skillId });
      if (maxRate !== "") params.set("maxRate", maxRate);
      setSwaps(null);
      setTeachers(await apiRequest(`/match/teachers?${params}`));
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function findSwaps() {
    setBusy(true);
    try {
      setTeachers(null);
      setSwaps(await apiRequest("/match/direct-swap"));
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  return (
    <div className="match-layout">
      <aside className="panel panel-lime sticky-panel">
        <p className="eyebrow">0-coins exchange</p><h2 className="title">Find a match</h2>
        <h3>Barter swaps</h3><p className="subcopy">Someone who teaches what you want and wants what you teach.</p>
        <button className="btn btn-primary btn-block" type="button" onClick={findSwaps} disabled={busy}>Find direct swaps</button>
        <hr className="divider" />
        <h3>Browse teachers</h3>
        <form onSubmit={searchTeachers}>
          <div className="field"><label className="label" htmlFor="match-skill">Skill</label><select id="match-skill" className="input" value={skillId} onChange={(e) => setSkillId(e.target.value)}><option value="">Select a skill</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></div>
          <div className="field"><label className="label" htmlFor="match-rate">Max hourly rate (coins)</label><input id="match-rate" className="input" type="number" min="0" placeholder="No maximum" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} /><span className="helper">Filter teachers by their hourly SkillCoin rate.</span></div>
          <button className="btn btn-block" type="submit" disabled={busy}>{busy ? "Searching..." : "Search teachers"}</button>
        </form>
      </aside>
      <div className="stack results">
        {teachers === null && swaps === null && <div className="empty"><strong>Start a search</strong><span>Find teachers or direct swaps.</span></div>}
        {Array.isArray(teachers) && !teachers.length && <div className="empty"><strong>No teachers found</strong><span>Try another skill or higher maximum rate.</span></div>}
        {teachers?.map((teacher) => (
          <article className="teacher-row" key={teacher.user.id}>
            <span className="avatar">{initials(teacher.user.name)}</span>
            <div><strong>{teacher.user.name}</strong><span className="chip chip-mono">{teacher.skill?.level || "Skill"}</span></div>
            <div className="teacher-price"><strong>{teacher.hourlyCoinRate}</strong><small>SC/hr</small><button className="btn btn-primary btn-sm" type="button" onClick={() => onPrefill({ teacherId: teacher.user.id, skillId: teacher.skillId, skillName: teacher.skill?.name, rate: teacher.hourlyCoinRate })}>Prefill booking</button></div>
          </article>
        ))}
        {Array.isArray(swaps) && !swaps.length && <div className="empty"><strong>No exact swaps yet</strong><span>Add more teach and learn skills, or browse teachers.</span></div>}
        {swaps?.map((swap) => (
          <article className="match-card" key={`${swap.partnerId}-${swap.iTeach}-${swap.iLearn}`}>
            <div className="match-body">
              <div className="match-side"><span className="avatar">You</span><span className="chip chip-lime">You teach: {swap.iTeach}</span></div>
              <span className="match-link"><ArrowLeftRight size={22} /></span>
              <div className="match-side match-right"><span className="avatar">{initials(swap.partnerName)}</span><strong>{swap.partnerName}</strong><span className="chip chip-blue">You learn: {swap.iLearn}</span></div>
            </div>
            <div className="match-foot"><strong>0 coins</strong><button className="btn btn-lime btn-sm" type="button" onClick={() => onPrefill({ teacherId: swap.partnerId, skillId: null, skillName: swap.iLearn, rate: 0 })}>Prefill booking</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SessionsTab({ balance, prefill, refreshBalance }) {
  const [sessions, setSessions] = useState([]);
  const [resolvedSkillId, setResolvedSkillId] = useState(prefill?.skillId || null);
  const [duration, setDuration] = useState(prefill?.sessionDuration || 60);
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(null);

  async function load() {
    setSessions(await apiRequest("/sessions/my"));
  }
  useEffect(() => { load().catch((error) => toast.error(error.message)); }, []);
  useEffect(() => {
    if (prefill?.skillId) { setResolvedSkillId(prefill.skillId); return; }
    if (prefill?.skillName) {
      apiRequest("/skills").then((skills) => {
        const skill = skills.find((item) => item.name === prefill.skillName);
        setResolvedSkillId(skill?.id || null);
      }).catch((error) => toast.error(error.message));
    }
  }, [prefill]);

  const cost = prefill?.rate ? Math.ceil((Number(prefill.rate) * Number(duration)) / 60) : 0;

  async function book(event) {
    event.preventDefault();
    if (!prefill?.teacherId || !resolvedSkillId || !scheduledAt) return toast.error("Choose a teacher, skill and schedule");
    setBusy(true);
    try {
      await apiRequest("/sessions", { method: "POST", body: { teacherId: Number(prefill.teacherId), skillId: Number(resolvedSkillId), scheduledAt, duration: Number(duration) } });
      toast.success("Session booked");
      setScheduledAt("");
      await Promise.all([load(), refreshBalance()]);
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function mutate(sessionId, action) {
    setBusy(true);
    try {
      await apiRequest(`/sessions/${sessionId}/${action}`, { method: "PATCH" });
      toast.success(action === "complete" ? "Session completed" : "Session cancelled");
      await Promise.all([load(), refreshBalance()]);
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function downloadReceipt(sessionId) {
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/receipt`, { headers: { Authorization: `Bearer ${state.accessToken}` } });
      if (!response.ok) throw new Error("Could not download receipt");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `SkillSwap-session-${sessionId}-receipt.pdf`; link.click();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded");
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function submitReview(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/reviews", { method: "POST", body: { sessionId: Number(review.id), rating: review.rating, comment: review.comment } });
      toast.success("Review submitted");
      setReview(null);
      await load();
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  const currentUserId = state.user?.id;
  return (
    <div className="sessions-layout">
      <article className="panel">
        <div className="panel-head"><div><p className="eyebrow">Session history</p><h2 className="title">Your sessions</h2></div><span className="chip chip-mono">{sessions.length} sessions</span></div>
        <div className="stack">{sessions.length ? sessions.map((session) => {
          const amTeacher = session.teacherId === currentUserId;
          const partner = amTeacher ? session.learner : session.teacher;
          const statusClass = session.status === "COMPLETED" ? "chip-lime" : session.status === "CANCELLED" ? "chip-coral" : "chip-butter";
          return (
            <article className="ticket" key={session.id}>
              <div className="ticket-main"><h3>{session.skill?.name || "Skill"}</h3><p>{new Date(session.scheduledAt).toLocaleString()} · {session.duration} min · with {partner?.name || "Unknown"}</p><span className="sticker">{amTeacher ? "Teaching" : "Learning"}</span></div>
              <div className="ticket-status"><span className={`chip ${statusClass}`}>{session.status}</span><strong>{session.coinsCost} SC</strong></div>
              <div className="ticket-actions">
                {session.status === "BOOKED" && amTeacher && <button className="btn btn-lime btn-sm" type="button" disabled={busy} onClick={() => mutate(session.id, "complete")}>Complete</button>}
                {session.status === "BOOKED" && <button className="btn btn-danger btn-sm" type="button" disabled={busy} onClick={() => mutate(session.id, "cancel")}>Cancel</button>}
                <button className="btn btn-ghost btn-sm" type="button" disabled={busy} onClick={() => downloadReceipt(session.id)}>Receipt PDF</button>
                {session.status === "COMPLETED" && session.learnerId === currentUserId && <button className="btn btn-primary btn-sm" type="button" onClick={() => setReview({ id: session.id, rating: 5, comment: "" })}>Review</button>}
              </div>
            </article>
          );
        }) : <div className="empty"><strong>No sessions yet</strong><span>Find a teacher in Match & Swap.</span></div>}</div>
      </article>
      <aside className="panel panel-lime sticky-panel">
        <p className="eyebrow">Ticket booth</p><h2 className="title">Book a session</h2>
        {!prefill?.teacherId ? <div className="empty"><strong>Pick a teacher in the Match tab first</strong></div> : (
          <form onSubmit={book}>
            <div className="booking-card"><strong>{prefill.skillName || "Selected skill"}</strong><small>{prefill.rate ? `${prefill.rate} SC/hr` : "0 coin barter"}</small></div>
            <div className="field"><label className="label" htmlFor="scheduled-at">Schedule</label><input id="scheduled-at" className="input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></div>
            <div className="field"><label className="label" htmlFor="duration">Duration in minutes</label><input id="duration" className="input" type="number" min="15" step="15" value={duration} onChange={(e) => setDuration(e.target.value)} /><div className="quick-durations">{[30,60,90,120].map((value) => <button type="button" className={`chip ${Number(duration) === value ? "chip-butter" : ""}`} key={value} onClick={() => setDuration(value)}>{value} min</button>)}</div></div>
            <div className="tape-preview"><div><span>Rate</span><strong>{prefill.rate || 0} SC/hr</strong></div><div><span>Duration</span><strong>{duration} min</strong></div><div><span>Cost</span><strong>{cost} SC</strong></div></div>
            {cost > balance && <div className="balance-warning">Not enough coins (you have {balance})</div>}
            <button className="btn btn-primary btn-block" type="submit" disabled={busy || cost > balance}>{busy ? "Booking..." : "Book session"}</button>
          </form>
        )}
      </aside>
      {review && <dialog open className="modal"><div className="modal-body"><div className="modal-head"><h2>Rate your session</h2><button className="icon-button" type="button" onClick={() => setReview(null)}><X size={18} /></button></div><form onSubmit={submitReview}><div className="stars">{[1,2,3,4,5].map((rating) => <button type="button" key={rating} className={rating <= review.rating ? "on" : ""} onClick={() => setReview({ ...review, rating })}><Star size={28} fill="currentColor" /></button>)}</div><div className="field"><label className="label" htmlFor="review-comment">Comment</label><textarea id="review-comment" className="textarea" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} /></div><button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Submitting..." : "Submit review"}</button></form></div></dialog>}
    </div>
  );
}

function ChatTab({ initialPartner }) {
  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(initialPartner || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [manualId, setManualId] = useState(initialPartner || "");
  const [busy, setBusy] = useState(false);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [learnerNotes, setLearnerNotes] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [resources, setResources] = useState([]);
  const [comments, setComments] = useState([]);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [comment, setComment] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [unread, setUnread] = useState(0);

  async function loadPartnersAndSessions() {
    const [sessions, unreadCount] = await Promise.all([
      apiRequest("/sessions/my"),
      apiRequest("/chat/unread/count").catch(() => ({ unreadCount: 0 })),
    ]);
    setUnread(Number(unreadCount.unreadCount || 0));
    setSessionOptions(sessions);
    const currentId = state.user?.id;
    const partnerMap = new Map();
    sessions.forEach((session) => {
      const partner = session.teacherId === currentId ? session.learner : session.teacher;
      if (partner && Number(partner.id) !== Number(currentId)) partnerMap.set(Number(partner.id), partner);
    });
    setPartners(Array.from(partnerMap.values()));
  }
  useEffect(() => { loadPartnersAndSessions().catch((error) => toast.error(error.message)); }, []);

  async function openConversation(partnerId) {
    if (!partnerId) return toast.error("Enter a partner user ID");
    setBusy(true);
    try {
      await apiRequest(`/chat/${partnerId}/read`, { method: "PATCH" });
      setActivePartner(Number(partnerId));
      setManualId(String(partnerId));
      setMessages(await apiRequest(`/chat/${partnerId}`));
      const unreadCount = await apiRequest("/chat/unread/count");
      setUnread(Number(unreadCount.unreadCount || 0));
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  useEffect(() => {
    if (initialPartner) openConversation(initialPartner);
  }, [initialPartner]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!activePartner || !text.trim()) return;
    setBusy(true);
    try {
      await apiRequest(`/chat/${activePartner}/message`, { method: "POST", body: { text: text.trim() } });
      setText("");
      setMessages(await apiRequest(`/chat/${activePartner}`));
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function loadNote() {
    if (!sessionId) return toast.error("Select a session");
    setBusy(true);
    try {
      const note = await apiRequest(`/notes/${sessionId}`);
      setTeacherNotes(note.teacherNotes || "");
      setLearnerNotes(note.learnerNotes || "");
      setTags(note.tags || []);
      setResources(note.resources || []);
      setComments(note.comments || []);
      toast.success("Session note loaded");
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function saveNote() {
    if (!sessionId) return toast.error("Select a session");
    setBusy(true);
    try {
      await apiRequest(`/notes/${sessionId}`, { method: "POST", body: { teacherNotes, learnerNotes, tags } });
      toast.success("Session note saved");
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function addResource() {
    if (!sessionId || !resourceTitle.trim() || !resourceUrl.trim()) return toast.error("Enter a session, title and URL");
    setBusy(true);
    try {
      await apiRequest(`/notes/${sessionId}/resources`, { method: "POST", body: { title: resourceTitle.trim(), url: resourceUrl.trim() } });
      setResourceTitle(""); setResourceUrl("");
      await loadNote();
      toast.success("Resource added");
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function addComment() {
    if (!sessionId || !comment.trim()) return toast.error("Enter a session and comment");
    setBusy(true);
    try {
      await apiRequest(`/notes/${sessionId}/comments`, { method: "POST", body: { text: comment.trim() } });
      setComment("");
      await loadNote();
      toast.success("Comment added");
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  async function searchTags() {
    if (!tags.length) return toast.error("Add at least one tag");
    setBusy(true);
    try {
      setSearchResults(await apiRequest(`/notes/search?tags=${encodeURIComponent(tags.join(","))}`));
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  }

  function addTag(event) {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    const value = tagInput.trim().replace(/^#/, "");
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setTagInput("");
  }

  const activePartnerName = partners.find((partner) => partner.id === activePartner)?.name || (activePartner ? `User #${activePartner}` : "Select a conversation");
  return (
    <div className="stack">
      <div className="chat-shell">
        <aside className="chat-list">
          <div className="chat-list-head"><h3>Conversations</h3>{unread > 0 && <span className="chip chip-coral">{unread} unread</span>}</div>
          <div className="conversation-list">{partners.length ? partners.map((partner) => (
            <button type="button" key={partner.id} className={activePartner === partner.id ? "active" : ""} onClick={() => openConversation(partner.id)}><span className="avatar">{initials(partner.name)}</span><strong>{partner.name}</strong></button>
          )) : <div className="empty"><strong>No conversations yet</strong><span>Open one with a session partner.</span></div>}</div>
          <div className="manual-chat"><h3>Or enter an ID</h3><div className="field"><label className="label" htmlFor="chat-partner">Partner user ID</label><input id="chat-partner" className="input" type="number" min="1" value={manualId} onChange={(e) => setManualId(e.target.value)} /><button className="btn btn-sm" type="button" disabled={busy} onClick={() => openConversation(manualId)}>Open</button></div></div>
        </aside>
        <section className="chat-pane"><header>{activePartnerName}</header><div className="chat-messages">{!activePartner ? <div className="empty"><strong>Select a conversation</strong><span>Pick someone on the left to start chatting.</span></div> : messages.length ? messages.map((message) => {
          const own = message.senderId === state.user?.id;
          return <div className={`bubble ${own ? "bubble-me" : "bubble-them"}`} key={message._id || message.createdAt}><span>{message.text}</span><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>;
        }) : <div className="empty"><strong>No messages yet</strong><span>Start the conversation.</span></div>}</div><form className="chat-send" onSubmit={sendMessage}><input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." disabled={!activePartner} /><button className="btn btn-primary" type="submit" disabled={!activePartner || busy}>{busy ? "Sending..." : "Send"}</button></form></section>
      </div>

      <article className="panel notes-panel">
        <p className="eyebrow">MongoDB session resources</p><h2 className="title">Session notes</h2>
        <div className="two-columns notes-columns">
          <section>
            <div className="field"><label className="label" htmlFor="note-session">Session</label><select id="note-session" className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}><option value="">Select a session</option>{sessionOptions.map((session) => <option key={session.id} value={session.id}>#{session.id} · {session.skill?.name} · {new Date(session.scheduledAt).toLocaleDateString()}</option>)}</select></div>
            <div className="field"><label className="label" htmlFor="note-tags">Tags</label><input id="note-tags" className="input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" /><div className="chip-list">{tags.map((tag) => <button type="button" className="chip chip-butter" key={tag} onClick={() => setTags(tags.filter((item) => item !== tag))}>#{tag} <X size={12} /></button>)}</div></div>
            <div className="field"><label className="label" htmlFor="teacher-notes">Teacher notes</label><textarea id="teacher-notes" className="textarea" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} /></div>
            <div className="field"><label className="label" htmlFor="learner-notes">Learner notes</label><textarea id="learner-notes" className="textarea" value={learnerNotes} onChange={(e) => setLearnerNotes(e.target.value)} /></div>
            <div className="row-actions"><button className="btn btn-primary" type="button" disabled={busy} onClick={loadNote}>Load note</button><button className="btn" type="button" disabled={busy} onClick={saveNote}>Save note</button><button className="btn btn-ghost" type="button" disabled={busy} onClick={searchTags}>Search tags</button></div>
            {searchResults && <div className="search-results">{searchResults.length ? searchResults.map((note) => <button type="button" key={note.sessionId} onClick={() => setSessionId(String(note.sessionId))}><strong>Session #{note.sessionId}</strong><span>{(note.tags || []).join(", ")}</span></button>) : <div className="empty"><strong>No matching notes</strong></div>}</div>}
          </section>
          <section>
            <h3>Resources</h3><div className="resource-list">{resources.length ? resources.map((resource, index) => <a key={index} href={resource.url} target="_blank" rel="noreferrer" className="chip"><strong>{resource.title}</strong><small>{new URL(resource.url).hostname}</small></a>) : <div className="empty"><strong>No resources yet</strong><span>Add a link for this session.</span></div>}</div>
            <div className="field"><label className="label" htmlFor="resource-title">Resource title</label><input id="resource-title" className="input" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} /></div>
            <div className="field"><label className="label" htmlFor="resource-url">Resource URL</label><input id="resource-url" className="input" type="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} /></div>
            <button className="btn btn-sm" type="button" disabled={busy} onClick={addResource}>Add resource</button>
            <hr className="divider" /><h3>Comments</h3><div className="comments">{comments.length ? comments.map((item, index) => <div className="bubble bubble-them" key={index}><strong>User #{item.userId}</strong><span>{item.text}</span><time>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</time></div>) : <div className="empty"><strong>No comments yet</strong></div>}</div>
            <div className="comment-row"><input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." /><button className="btn btn-sm" type="button" disabled={busy} onClick={addComment}>Post</button></div>
          </section>
        </div>
      </article>
    </div>
  );
}

function AnalyticsTab({ user }) {
  const [mentors, setMentors] = useState([]);
  const [tags, setTags] = useState([]);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    Promise.all([
      apiRequest("/analytics/top-mentors"),
      apiRequest("/analytics/trending-tags"),
      user?.role === "ADMIN" ? Promise.all([
        apiRequest("/analytics/budget-teachers"),
        apiRequest("/analytics/popular-categories"),
        apiRequest("/analytics/economy"),
        apiRequest("/analytics/demand-gap"),
      ]) : Promise.resolve(null),
    ]).then(([mentorData, tagData, adminData]) => {
      setMentors(mentorData);
      setTags(tagData);
      if (adminData) setAdmin({ budget: adminData[0], categories: adminData[1], economy: adminData[2]?.[0] || {}, demand: adminData[3] });
    }).catch((error) => toast.error(error.message));
  }, [user?.role]);

  const top = mentors[0];
  const maxTag = Math.max(1, ...tags.map((tag) => Number(tag.totalSessions || 0)));

  return (
    <div className="stack">
      <div className="stats-grid">
        <article className="stat panel-lime"><span>Mentor rankings</span><strong>{mentors.length}</strong></article>
        <article className="stat panel-butter"><span>Trending tags</span><strong>{tags.length}</strong></article>
        <article className="stat"><span>Top mentor coins</span><strong>{top?.coinsEarned || 0}</strong></article>
        <article className="stat panel-lime"><span>Top mentor rating</span><strong>{Number(top?.averageRating || 0).toFixed(1)} <Star size={18} fill="currentColor" /></strong></article>
      </div>
      <div className="two-columns">
        <article className="panel">
          <p className="eyebrow">Mentor rankings</p><h2 className="title">Top mentors</h2>
          {mentors.length ? <div className="mentor-list">{mentors.map((mentor, index) => (
            <div className="teacher-row" key={mentor.userId}><span className="avatar">{initials(mentor.name)}</span><div><strong>{mentor.name}</strong><span className="chip chip-mono">{mentor.badge}</span></div><div className="teacher-price"><strong>{mentor.coinsEarned} SC</strong><small>★ {Number(mentor.averageRating || 0).toFixed(1)}</small><span>#{index + 1}</span></div></div>
          ))}</div> : <div className="empty"><strong>No mentors ranked yet</strong><span>Complete sessions to appear here.</span></div>}
        </article>
        <article className="panel">
          <p className="eyebrow">Live interests</p><h2 className="title">Trending tags</h2>
          {tags.length ? <div className="tag-bars">{tags.map((tag) => <div className="tag-bar" key={tag.tag}><span>#{tag.tag}</span><div><b style={{ width: `${Math.max(8, (Number(tag.totalSessions) / maxTag) * 100)}%` }} /></div><strong>{tag.totalSessions}</strong></div>)}</div> : <div className="empty"><strong>No trending tags yet</strong><span>Tag session notes to light this up.</span></div>}
        </article>
      </div>
      {user?.role === "ADMIN" && admin && (
        <article className="panel panel-ink">
          <div className="panel-head"><div><p className="eyebrow">SQL performance insights</p><h2 className="title">Admin SQL insights</h2></div><span className="sticker">ADMIN</span></div>
          <div className="admin-grid">
            <section><span className="chip chip-mono">SUM / COUNT / AVG</span><div className="economy"><strong>{admin.economy.totalCoinsInCirculation || 0}</strong><span>Coins in circulation</span><strong>{admin.economy.completedSessions || 0}</strong><span>Completed sessions</span><strong>{Number(admin.economy.averageSessionCost || 0).toFixed(1)}</strong><span>Avg session cost</span></div></section>
            <section><span className="chip chip-mono">Correlated subquery</span><div className="compact-tape">{admin.budget?.length ? admin.budget.slice(0,5).map((row) => <div key={`${row.name}-${row.skill}`}><strong>{row.name} · {row.skill}</strong><b>{row.rate} SC</b></div>) : <div className="empty"><strong>No budget teachers</strong></div>}</div></section>
            <section><span className="chip chip-mono">GROUP BY / HAVING</span><div className="compact-tape">{admin.categories?.length ? admin.categories.slice(0,5).map((row) => <div key={row.name}><strong>{row.name}</strong><b>{row.skillCount}</b></div>) : <div className="empty"><strong>No categories</strong></div>}</div></section>
            <section><span className="chip chip-mono">IN / NOT IN</span><div className="chip-list">{admin.demand?.length ? admin.demand.map((row) => <span className="chip chip-coral" key={row.name || row}>{row.name || row}</span>) : <div className="empty"><strong>No demand gaps</strong></div>}</div></section>
          </div>
        </article>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return state.accessToken ? JSON.parse(localStorage.getItem("skillswap_current_user") || "null") : null; } catch { return null; }
  });
  const [tab, setTab] = useState("skills");
  const [balance, setBalance] = useState(0);
  const [prefill, setPrefill] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("skillswap_theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("skillswap_theme", dark ? "dark" : "light");
  }, [dark]);

  async function refreshBalance() {
    const result = await apiRequest("/coins/balance");
    setBalance(result.coins || 0);
  }

  async function restoreUser() {
    if (!state.accessToken) return;
    try {
      const me = await apiRequest("/users/me");
      state.user = me;
      setUser(me);
      await refreshBalance();
    } catch {
      clearAuth();
      setUser(null);
    }
  }
  useEffect(() => { if (state.accessToken) restoreUser(); }, []);

  async function handleAuthenticated(loginUser) {
    state.user = loginUser;
    setUser(loginUser);
    await refreshBalance();
  }

  async function logout() {
    try { if (state.accessToken) await apiRequest("/auth/logout", { method: "POST" }); } catch {}
    clearAuth(); setUser(null); setTab("skills");
    toast.success("Logged out");
  }

  function prefillBooking(next) {
    setPrefill(next);
    setTab("sessions");
  }

  if (!user) return <><Header user={null} balance={0} tab={tab} setTab={setTab} onLogout={logout} dark={dark} setDark={setDark} /><AuthView onAuthenticated={handleAuthenticated} /></>;

  return (
    <>
      <Header user={user} balance={balance} tab={tab} setTab={setTab} onLogout={logout} dark={dark} setDark={setDark} />
      <main className="dashboard">
        <div className="dashboard-heading"><div><p className="eyebrow">Skills exchange hub</p><h1>Hey, <span className="highlight">{user.name?.split(" ")[0] || "Learner"}</span></h1></div><p className="dashboard-tag">Teach · Earn · Learn · Repeat</p></div>
        <nav className="dashboard-tabs" role="tablist">{TABS.map(([id, label, Icon], index) => <button type="button" role="tab" key={id} aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{String(index + 1).padStart(2, "0")}</span>{label}</button>)}</nav>
        <div key={tab} className="tab-content">
          {tab === "skills" && <SkillsTab user={user} balance={balance} refreshBalance={refreshBalance} />}
          {tab === "match" && <MatchTab onPrefill={prefillBooking} />}
          {tab === "sessions" && <SessionsTab balance={balance} prefill={prefill} refreshBalance={refreshBalance} />}
          {tab === "chat" && <ChatTab initialPartner={chatPartner} />}
          {tab === "analytics" && <AnalyticsTab user={user} />}
        </div>
      </main>
    </>
  );
}
