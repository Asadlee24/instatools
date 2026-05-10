from flask import Flask, jsonify
from flask_cors import CORS
from instagrapi import Client
import os

app = Flask(__name__)
CORS(app)

# ============================================
# CREDENTIALS .env file mein rakho, yahan nahi
# .env file mein likho:
#   INSTAGRAM_USERNAME=yourburneraccount
#   INSTAGRAM_PASSWORD=yourpassword
# ============================================
INSTAGRAM_USERNAME = os.environ.get("INSTAGRAM_USERNAME", "")
INSTAGRAM_PASSWORD = os.environ.get("INSTAGRAM_PASSWORD", "")
FOLLOWER_SAMPLE_LIMIT = 100

cl = Client()
logged_in = False

def ensure_login():
    global logged_in
    if not logged_in:
        if not INSTAGRAM_USERNAME or not INSTAGRAM_PASSWORD:
            raise Exception("INSTAGRAM_USERNAME aur INSTAGRAM_PASSWORD env variables set nahi hain.")
        cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
        logged_in = True

@app.route('/analyze/<username>')
def analyze(username):
    try:
        ensure_login()
        print(f"Analyzing: {username}")

        user = cl.user_info_by_username(username)
        followers_count = user.follower_count
        following_count = user.following_count
        posts_count     = user.media_count

        print("Followers fetch ho rahe hain...")
        followers = cl.user_followers(user.pk, amount=FOLLOWER_SAMPLE_LIMIT)

        bots = ghosts = suspicious = 0
        total = len(followers)

        for uid, f in followers.items():
            if f.follower_count == 0 and f.following_count > 500:
                bots += 1
            elif f.media_count == 0:
                ghosts += 1
            elif f.following_count > 2000 and f.follower_count < 100:
                suspicious += 1

        real = max(0, total - bots - ghosts - suspicious)

        bot_pct  = round(bots / total * 100)  if total else 0
        ghost_pct= round(ghosts / total * 100) if total else 0
        susp_pct = round(suspicious / total * 100) if total else 0
        real_pct = round(real / total * 100)  if total else 0

        credibility = max(10, min(95, real_pct - bot_pct * 2))

        medias       = cl.user_medias(user.pk, amount=6)
        avg_likes    = 0
        avg_comments = 0
        likes_list   = []

        if medias:
            avg_likes    = round(sum(m.like_count    for m in medias) / len(medias))
            avg_comments = round(sum(m.comment_count for m in medias) / len(medias))
            likes_list   = [m.like_count for m in medias]

        eng_rate = round((avg_likes + avg_comments) / followers_count * 100, 2) if followers_count else 0

        return jsonify({
            "username":            user.username,
            "full_name":           user.full_name,
            "bio":                 user.biography,
            "followers":           followers_count,
            "following":           following_count,
            "posts":               posts_count,
            "is_verified":         user.is_verified,
            "profile_pic":         str(user.profile_pic_url),
            "real_followers_pct":  real_pct,
            "bot_followers_pct":   bot_pct,
            "ghost_followers_pct": ghost_pct,
            "suspicious_pct":      susp_pct,
            "credibility_score":   credibility,
            "engagement_rate":     eng_rate,
            "avg_likes":           avg_likes,
            "avg_comments":        avg_comments,
            "last_posts_likes":    likes_list,
            "account_quality":     "Verified" if user.is_verified else ("Suspicious" if credibility < 40 else "Normal"),
            "growth_trend":        "bought" if bot_pct > 30 else ("growing" if eng_rate > 4 else "stable"),
            "posts_per_week":      round(posts_count / 52, 1),
        })

    except Exception as e:
        msg = str(e)
        print(f"Error: {msg}")
        if "Please wait" in msg or "rate limit" in msg.lower():
            msg = "Instagram ne rate limit laga di. Thodi der baad try karo."
        elif "challenge_required" in msg.lower() or "checkpoint" in msg.lower():
            msg = "Instagram ne verification maangi hai. Account browser pe check karo."
        elif "login" in msg.lower() or "not found" in msg.lower():
            msg = "Login fail hua ya username nahi mila."
        return jsonify({"error": msg}), 400

@app.route('/')
def home():
    return "✅ InstaScan Backend chal raha hai!"

if __name__ == '__main__':
    print("🚀 Server start ho raha hai port 5000 pe...")
    app.run(port=5000, debug=True)
