from flask import Flask, jsonify, request
from flask_cors import CORS
from instagrapi import Client
import time
import os

# Load environment variables
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")

if not INSTAGRAM_USERNAME or not INSTAGRAM_PASSWORD:
    raise Exception("Environment variables for Instagram credentials must be set.")

app = Flask(__name__)
CORS(app)

FOLLOWER_SAMPLE_LIMIT = 50

print("🛡️ Starting Integration...")
cl = Client()

try:
    # Login with a bit of delay to avoid instant block
    cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
    print("✅ System Online: Connection to Instagram Secure.")
except Exception as e:
    print(f"❌ Firewall Breach: Login failed: {e}")

@app.route('/analyze/<username>')
def analyze(username):
    try:
        print(f"🔍 Auditing Target: {username}")
        
        # Basic profile info
        user = cl.user_info_by_username(username)
        is_private = user.is_private
        followers_count = user.follower_count
        following_count = user.following_count
        posts_count = user.media_count
        
        print("💾 Extracting Data Samples...")
        followers = cl.user_followers(user.pk, amount=FOLLOWER_SAMPLE_LIMIT)
        bots, ghosts, suspicious = 0, 0, 0
        total = len(followers)
        
        for uid, f in followers.items():
            if f.follower_count == 0 and f.following_count > 500:
                bots += 1
            elif f.media_count == 0:
                ghosts += 1
            elif f.following_count > 2000 and f.follower_count < 100:
                suspicious += 1
        
        real = max(0, total - bots - ghosts - suspicious)
        bot_pct = round(bots / total * 100) if total else 0
        real_pct = round(real / total * 100) if total else 0
        credibility = max(10, min(98, real_pct - (bot_pct * 1.5)))

        medias = cl.user_medias(user.pk, amount=5)
        avg_likes, avg_comments = 0, 0
        
        if medias:
            avg_likes = round(sum(m.like_count for m in medias) / len(medias))
            avg_comments = round(sum(m.comment_count for m in medias) / len(medias))
        
        eng_rate = round((avg_likes + avg_comments) / followers_count * 100, 2) if followers_count else 0
        
        if credibility > 75:
            status_label = "SECURE"
            status_color = "#00e676"
        elif credibility > 45:
            status_label = "WARNING"
            status_color = "#ffeb3b"
        else:
            status_label = "RISKY / BOT"
            status_color = "#ff5252"
            
        return jsonify({
            "status": "success",
            "audit_data": {
                "username": user.username,
                "full_name": user.full_name,
                "profile_pic": str(user.profile_pic_url),
                "is_verified": user.is_verified,
                "is_private": is_private,
                "stats": {
                    "followers": followers_count,
                    "following": following_count,
                    "posts": posts_count,
                    "engagement_rate": f"{eng_rate}%"
                },
                "security_metrics": {
                    "credibility_score": credibility,
                    "real_followers": f"{real_pct}%",
                    "bot_detection": f"{bot_pct}%",
                    "status": status_label,
                    "status_color": status_color
                },
                "verdict": f"Audit complete. Target account shows {status_label} behavior patterns."
            }
        })
    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower():
            return jsonify({"error": "Instagram Rate Limit: Please wait 15 mins."}), 429
        return jsonify({"error": "Failed to bypass security layers or user not found."}), 400

@app.route('/')
def home():
    return jsonify({"message": "🛡️ Asad Lee's Insta-Scan API is Running."})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
