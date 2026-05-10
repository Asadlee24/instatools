import { useState } from "react";

function formatNum(n) {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function ScoreRing({ score, size }) {
  const s = size || 80;
  const r = s / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#00e676" : score >= 40 ? "#ffea00" : "#ff1744";
  return (
    <svg width={s} height={s}>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={dash + " " + (circ - dash)}
        strokeLinecap="round" strokeDashoffset={circ / 4}
        style={{ filter: "drop-shadow(0 0 6px " + color + ")" }}
      />
      <text x={s/2} y={s/2+5} textAnchor="middle" fill={color}
        fontSize={s*0.22} fontWeight="800" fontFamily="monospace">{score}</text>
    </svg>
  );
}

function BarChart({ data }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "60px" }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            width: "100%", borderRadius: "3px 3px 0 0",
            background: i === data.length - 1 ? "linear-gradient(180deg,#00e5ff,#0091ea)" : "rgba(0,229,255,0.25)",
            height: Math.max(4, (v / max) * 52) + "px",
            boxShadow: i === data.length - 1 ? "0 0 8px #00e5ff88" : "none",
          }}/>
        </div>
      ))}
    </div>
  );
}

export default function InstagramAnalyzer() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const analyze = async () => {
    if (!username.trim()) return;
    setError("");
    setData(null);
    setLoading(true);
    setActiveTab("overview");

    try {
      const res = await fetch("http://localhost:5000/analyze/" + username.trim().toLowerCase());
      const json = await res.json();
      if (json.error) {
        setError("❌ Error: " + json.error);
      } else {
        setData(json);
      }
    } catch (e) {
      setError("❌ Backend se connect nahi ho saka. backend.py chal raha hai? (localhost:5000)");
    }

    setLoading(false);
  };

  const scoreColor = (s) => s >= 70 ? "#00e676" : s >= 40 ? "#ffea00" : "#ff1744";
  const trendLabel = (t) => ({ growing: "📈 Growing", stable: "➡️ Stable", declining: "📉 Declining", bought: "🚨 Bought Followers!" })[t] || "➡️ Stable";
  const tabs = ["overview", "engagement", "verdict"];

  return (
    <div style={{ minHeight: "100vh", background: "#050a0f", fontFamily: "'Courier New', monospace", color: "#e0f7fa" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #00e5ff44; border-radius: 2px; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px #00e5ff15} 50%{box-shadow:0 0 40px #00e5ff35} }
        .card { background:rgba(255,255,255,0.03); border:1px solid rgba(0,229,255,0.12); border-radius:12px; padding:18px; animation:fadeUp 0.4s ease both; }
        .card:hover { border-color:rgba(0,229,255,0.25); }
        .label { font-size:10px; letter-spacing:2px; color:rgba(0,229,255,0.6); text-transform:uppercase; margin-bottom:14px; }
        .tab-btn { background:transparent; border:1px solid rgba(0,229,255,0.15); color:rgba(224,247,250,0.4); padding:6px 14px; border-radius:4px; cursor:pointer; font-family:'Courier New',monospace; font-size:11px; letter-spacing:1px; text-transform:uppercase; transition:all 0.2s; }
        .tab-btn:hover { border-color:rgba(0,229,255,0.4); color:#00e5ff; }
        .tab-btn.active { background:rgba(0,229,255,0.1); border-color:#00e5ff; color:#00e5ff; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Grid BG */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(0,229,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.025) 1px,transparent 1px)",
        backgroundSize:"40px 40px" }}/>
      <div style={{ position:"fixed", top:"-100px", left:"-80px", width:"360px", height:"360px", borderRadius:"50%",
        background:"radial-gradient(circle,rgba(0,229,255,0.06) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }}/>
      <div style={{ position:"fixed", bottom:"-80px", right:"-60px", width:"320px", height:"320px", borderRadius:"50%",
        background:"radial-gradient(circle,rgba(233,30,99,0.06) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:1, maxWidth:"720px", margin:"0 auto", padding:"28px 16px 60px" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
            <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#00e676", boxShadow:"0 0 8px #00e676", animation:"blink 2s infinite" }}/>
            <span style={{ fontSize:"10px", letterSpacing:"3px", color:"rgba(0,229,255,0.5)", textTransform:"uppercase" }}>Live — Real Data</span>
          </div>
          <div style={{ fontSize:"clamp(36px,9vw,66px)", fontWeight:"900", letterSpacing:"6px",
            background:"linear-gradient(135deg,#00e5ff 0%,#fff 50%,#e91e63 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1 }}>
            INSTA SCAN
          </div>
          <div style={{ color:"rgba(224,247,250,0.3)", fontSize:"11px", letterSpacing:"3px", marginTop:"8px" }}>
            INSTAGRAM ACCOUNT INTELLIGENCE TOOL
          </div>
        </div>

        {/* Search Box */}
        <div className="card" style={{ marginBottom:"24px", animation:"glow 4s ease-in-out infinite" }}>
          <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
            <span style={{ color:"#00e5ff", fontSize:"20px", flexShrink:0 }}>@</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g,""))}
              onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="instagram username likho..."
              style={{ flex:1, background:"transparent", border:"none", outline:"none",
                color:"#e0f7fa", fontSize:"16px", fontFamily:"'Courier New',monospace", caretColor:"#00e5ff" }}
            />
            <button onClick={analyze} disabled={loading || !username.trim()}
              style={{ background: loading ? "rgba(0,229,255,0.08)" : "linear-gradient(135deg,#00e5ff,#0091ea)",
                border:"none", borderRadius:"8px", padding:"10px 20px",
                color: loading ? "rgba(0,229,255,0.4)" : "#000",
                fontWeight:"800", fontSize:"12px", cursor: loading ? "not-allowed" : "pointer",
                fontFamily:"'Courier New',monospace", letterSpacing:"1px",
                boxShadow: loading ? "none" : "0 0 20px #00e5ff33", transition:"all 0.2s" }}>
              {loading ? "SCANNING..." : "ANALYZE"}
            </button>
          </div>

          {/* Backend status */}
          <div style={{ marginTop:"12px", display:"flex", alignItems:"center", gap:"6px" }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#00e676", boxShadow:"0 0 5px #00e676", animation:"blink 2s infinite" }}/>
            <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)", letterSpacing:"1px" }}>
              Backend: localhost:5000 — Real Instagram data
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"rgba(255,23,68,0.08)", border:"1px solid rgba(255,23,68,0.3)", borderRadius:"10px",
            padding:"14px 18px", marginBottom:"18px", fontSize:"13px", color:"#ff6b6b", animation:"fadeUp 0.3s ease" }}>
            {error}
            <div style={{ marginTop:"8px", fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>
              💡 Fix: Command Prompt mein <code style={{color:"#00e5ff"}}>python backend.py</code> chalaao
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"50px 20px", animation:"fadeUp 0.3s ease" }}>
            <div style={{ position:"relative", width:"72px", height:"72px", margin:"0 auto 18px" }}>
              <div style={{ position:"absolute", inset:0, border:"2px solid rgba(0,229,255,0.1)", borderRadius:"50%" }}/>
              <div style={{ position:"absolute", inset:0, border:"2px solid transparent", borderTopColor:"#00e5ff", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
              <div style={{ position:"absolute", inset:"14px", border:"2px solid transparent", borderTopColor:"#e91e63", borderRadius:"50%", animation:"spin 0.7s linear infinite reverse" }}/>
            </div>
            <div style={{ color:"#00e5ff", fontSize:"13px", letterSpacing:"2px" }}>SCANNING @{username}</div>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", marginTop:"6px" }}>
              Real Instagram data fetch ho raha hai... (30-60 sec lag sakte hain)
            </div>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div style={{ animation:"fadeUp 0.5s ease" }}>

            {/* Profile Card */}
            <div className="card" style={{ marginBottom:"14px", display:"flex", gap:"18px", alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <div style={{ width:"68px", height:"68px", borderRadius:"50%",
                  background:"linear-gradient(135deg,#e91e63,#00e5ff)", padding:"2px" }}>
                  <img src={data.profile_pic || `https://ui-avatars.com/api/?name=${data.username}&background=333&color=fff`}
                    alt="pfp"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${data.username}&background=333&color=fff`; }}
                    style={{ width:"100%", height:"100%", borderRadius:"50%", display:"block" }}/>
                </div>
                {data.is_verified && (
                  <div style={{ position:"absolute", bottom:0, right:0, background:"#1da1f2", borderRadius:"50%",
                    width:"18px", height:"18px", display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"10px", color:"#fff" }}>✓</div>
                )}
              </div>
              <div style={{ flex:1, minWidth:"140px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"17px", fontWeight:"700", color:"#fff" }}>{data.full_name || data.username}</span>
                  <span style={{
                    background: data.credibility_score >= 70 ? "rgba(0,230,118,0.12)" : data.credibility_score >= 40 ? "rgba(255,234,0,0.12)" : "rgba(255,23,68,0.12)",
                    color: scoreColor(data.credibility_score),
                    border:"1px solid " + scoreColor(data.credibility_score) + "44",
                    borderRadius:"4px", padding:"2px 8px", fontSize:"9px", letterSpacing:"1px"
                  }}>{data.account_quality}</span>
                </div>
                <div style={{ color:"rgba(0,229,255,0.6)", fontSize:"12px", marginTop:"2px" }}>@{data.username}</div>
                {data.bio && <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", marginTop:"4px" }}>{data.bio.slice(0,60)}{data.bio.length > 60 ? "..." : ""}</div>}
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", marginTop:"4px" }}>
                  {trendLabel(data.growth_trend)}
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <ScoreRing score={data.credibility_score || 0} size={72}/>
                <div style={{ fontSize:"9px", letterSpacing:"1px", color:"rgba(255,255,255,0.25)", marginTop:"2px" }}>CREDIBILITY</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"14px" }}>
              {[
                { label:"FOLLOWERS", value:formatNum(data.followers), icon:"👥" },
                { label:"FOLLOWING", value:formatNum(data.following), icon:"➡️" },
                { label:"POSTS", value:formatNum(data.posts), icon:"📸" },
              ].map((s,i) => (
                <div key={i} className="card" style={{ textAlign:"center", animationDelay: i*0.08+"s" }}>
                  <div style={{ fontSize:"20px" }}>{s.icon}</div>
                  <div style={{ fontSize:"22px", fontWeight:"800", color:"#00e5ff", letterSpacing:"1px" }}>{s.value}</div>
                  <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.3)", letterSpacing:"2px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap" }}>
              {tabs.map(t => (
                <button key={t} className={"tab-btn"+(activeTab===t?" active":"")} onClick={() => setActiveTab(t)}>{t}</button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === "overview" && (
              <div style={{ display:"grid", gap:"12px" }}>
                <div className="card">
                  <div className="label">Follower Breakdown</div>
                  <div style={{ display:"flex", borderRadius:"6px", overflow:"hidden", marginBottom:"16px", height:"10px" }}>
                    <div style={{ width:data.real_followers_pct+"%", background:"linear-gradient(90deg,#00e676,#00c853)", transition:"width 1s ease" }}/>
                    <div style={{ width:data.ghost_followers_pct+"%", background:"rgba(255,234,0,0.8)", transition:"width 1s ease" }}/>
                    <div style={{ width:data.bot_followers_pct+"%", background:"linear-gradient(90deg,#ff1744,#d50000)", transition:"width 1s ease" }}/>
                  </div>
                  {[
                    { label:"Real Followers", pct:data.real_followers_pct||0, color:"#00e676", count:Math.floor((data.followers||0)*(data.real_followers_pct||0)/100) },
                    { label:"Ghost Followers", pct:data.ghost_followers_pct||0, color:"#ffea00", count:Math.floor((data.followers||0)*(data.ghost_followers_pct||0)/100) },
                    { label:"Bot Followers", pct:data.bot_followers_pct||0, color:"#ff1744", count:Math.floor((data.followers||0)*(data.bot_followers_pct||0)/100) },
                  ].map((item,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:item.color, flexShrink:0, boxShadow:"0 0 5px "+item.color }}/>
                      <div style={{ flex:1, fontSize:"12px", color:"rgba(255,255,255,0.65)" }}>{item.label}</div>
                      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)" }}>{formatNum(item.count)}</div>
                      <div style={{ width:"100px", background:"rgba(255,255,255,0.05)", borderRadius:"4px", overflow:"hidden" }}>
                        <div style={{ width:item.pct+"%", height:"4px", background:item.color, borderRadius:"4px" }}/>
                      </div>
                      <div style={{ color:item.color, fontSize:"13px", fontWeight:"700", width:"34px", textAlign:"right" }}>{item.pct}%</div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ borderColor: (data.suspicious_pct||0) > 25 ? "rgba(255,23,68,0.3)" : "rgba(0,229,255,0.12)" }}>
                  <div className="label">Suspicious Activity</div>
                  <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
                    <div style={{ fontSize:"52px", fontWeight:"900", color:(data.suspicious_pct||0) > 25 ? "#ff1744" : "#ffea00", lineHeight:1 }}>
                      {data.suspicious_pct||0}%
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"4px", overflow:"hidden", marginBottom:"8px" }}>
                        <div style={{ width:(data.suspicious_pct||0)+"%", height:"6px",
                          background:(data.suspicious_pct||0) > 25 ? "linear-gradient(90deg,#ff1744,#ff6d00)" : "#ffea00", borderRadius:"4px" }}/>
                      </div>
                      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)" }}>
                        {(data.suspicious_pct||0) > 35 ? "⚠️ HIGH RISK — Likely purchased followers"
                          : (data.suspicious_pct||0) > 20 ? "⚡ MODERATE — Kuch suspicious patterns"
                          : "✅ LOW — Account genuine lagta hai"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Engagement */}
            {activeTab === "engagement" && (
              <div style={{ display:"grid", gap:"12px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {[
                    { label:"ENGAGEMENT RATE", value:(data.engagement_rate||0)+"%", good:(data.engagement_rate||0)>=3, icon:"💡" },
                    { label:"AVG LIKES", value:formatNum(data.avg_likes||0), good:true, icon:"❤️" },
                    { label:"AVG COMMENTS", value:formatNum(data.avg_comments||0), good:true, icon:"💬" },
                    { label:"POSTS / WEEK", value:String(data.posts_per_week||0), good:(data.posts_per_week||0)>=2, icon:"📅" },
                  ].map((s,i) => (
                    <div key={i} className="card" style={{ animationDelay:i*0.07+"s" }}>
                      <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.icon}</div>
                      <div style={{ fontSize:"24px", fontWeight:"900", color:s.good?"#00e5ff":"#ffea00" }}>{s.value}</div>
                      <div style={{ fontSize:"8px", color:"rgba(255,255,255,0.28)", letterSpacing:"1px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {data.last_posts_likes && data.last_posts_likes.length > 0 && (
                  <div className="card">
                    <div className="label">Last {data.last_posts_likes.length} Posts Performance</div>
                    <BarChart data={data.last_posts_likes}/>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px" }}>
                      <span style={{ fontSize:"9px", color:"rgba(255,255,255,0.2)" }}>oldest</span>
                      <span style={{ fontSize:"9px", color:"#00e5ff" }}>latest ▲</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verdict */}
            {activeTab === "verdict" && (
              <div style={{ display:"grid", gap:"12px" }}>
                <div style={{
                  background: (data.credibility_score||0) >= 70 ? "rgba(0,230,118,0.07)" : (data.credibility_score||0) >= 40 ? "rgba(255,234,0,0.07)" : "rgba(255,23,68,0.07)",
                  border:"1px solid " + scoreColor(data.credibility_score||0) + "33",
                  borderRadius:"12px", padding:"24px", textAlign:"center", animation:"fadeUp 0.4s ease",
                }}>
                  <ScoreRing score={data.credibility_score||0} size={96}/>
                  <div style={{ fontSize:"24px", fontWeight:"900", letterSpacing:"3px", marginTop:"10px", color:scoreColor(data.credibility_score||0) }}>
                    {(data.credibility_score||0) >= 70 ? "✅ GENUINE ACCOUNT"
                      : (data.credibility_score||0) >= 40 ? "⚡ MIXED SIGNALS"
                      : "🚨 SUSPICIOUS ACCOUNT"}
                  </div>
                  <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px", maxWidth:"380px", margin:"8px auto 0", lineHeight:1.6 }}>
                    {(data.credibility_score||0) >= 70
                      ? "Strong authenticity indicators. Followers genuine hain."
                      : (data.credibility_score||0) >= 40
                      ? "Mixed signals. Kuch followers bots ya ghosts ho sakte hain."
                      : "High bot/ghost ratio. Is account ne followers kharide hain!"}
                  </div>
                </div>

                <div className="card">
                  <div className="label">Detailed Checks</div>
                  {[
                    { label:"Follower Quality", status:(data.real_followers_pct||0)>=60?"good":(data.real_followers_pct||0)>=40?"warn":"bad", text:(data.real_followers_pct||0)+"% real" },
                    { label:"Engagement Health", status:(data.engagement_rate||0)>=3?"good":(data.engagement_rate||0)>=1?"warn":"bad", text:(data.engagement_rate||0)+"% rate" },
                    { label:"Bot Detection", status:(data.bot_followers_pct||0)<=10?"good":(data.bot_followers_pct||0)<=25?"warn":"bad", text:(data.bot_followers_pct||0)+"% bots" },
                    { label:"Growth Pattern", status:data.growth_trend==="growing"?"good":data.growth_trend==="bought"?"bad":"warn", text:trendLabel(data.growth_trend) },
                  ].map((v,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", flexShrink:0,
                        background:v.status==="good"?"#00e676":v.status==="warn"?"#ffea00":"#ff1744",
                        boxShadow:"0 0 5px "+(v.status==="good"?"#00e676":v.status==="warn"?"#ffea00":"#ff1744") }}/>
                      <div style={{ flex:1, fontSize:"12px", color:"rgba(255,255,255,0.65)" }}>{v.label}</div>
                      <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>{v.text}</div>
                      <div style={{ fontSize:"10px", fontWeight:"700",
                        color:v.status==="good"?"#00e676":v.status==="warn"?"#ffea00":"#ff1744" }}>
                        {v.status==="good"?"✓ PASS":v.status==="warn"?"⚡ WARN":"✗ FAIL"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop:"16px", textAlign:"center", color:"rgba(255,255,255,0.15)", fontSize:"10px", letterSpacing:"1px" }}>
              ✅ LIVE MODE — Real Instagram data • Powered by instagrapi
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div style={{ textAlign:"center", padding:"44px 20px", color:"rgba(255,255,255,0.2)", animation:"fadeUp 0.5s ease" }}>
            <div style={{ fontSize:"52px", marginBottom:"14px" }}>🔍</div>
            <div style={{ fontSize:"14px", letterSpacing:"1px" }}>Koi bhi Instagram username type karo</div>
            <div style={{ fontSize:"11px", marginTop:"8px", color:"rgba(255,255,255,0.1)" }}>
              Real data fetch hoga — 30-60 seconds lag sakte hain
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
