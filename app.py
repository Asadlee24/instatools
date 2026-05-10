from flask import Flask, jsonify, request
from flask_cors import CORS
from instagrapi import Client
import os

app = Flask(__name__)
CORS(app)

# ==========================================
# CONFIGURATION
# Vercel par deployment ke waqt ye values 
# Environment Variables se bhi uthai ja sakti hain
# ==========================================
INSTAGRAM_USERNAME = "joyboy3098"
INSTAGRAM_PASSWORD = "Asadaly24@."
FOLLOWER_SAMPLE_LIMIT = 30  # Vercel timeout se bachne ke liye limit kam rakhi hai

# Instagram Client Setup
cl = Client()

def login_to_insta():
    try:
        print("🛡️ Asad Lee Security Protocol: Connecting to Instagram...")
        cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
        return True
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return False

# First login attempt
login_status = login_to_insta()

@app.route('/analyze/<username>')
def analyze(username):
    # Agar pehle login fail hua tha toh dubara try karein
    if not cl.user_id:
        login_to_insta()

    try:
        print(f"🔍 Auditing Target: {username}")
        
        # 1. Basic Info Fetching
        user = cl.user_info_by_username(username)
        
        # 2. Privacy & Stats
        is_private = user.is_private
        followers_count = user.follower_count
        following_count = user.following_count
        posts_count = user.media_count

        # 3. Follower Quality Analysis (Sample)
        print("💾 Extracting Data Samples...")
        followers = cl.user_followers(user.pk, amount=FOLLOWER_SAMPLE_LIMIT)

        bots = 0
        ghosts = 0
        suspicious = 0
        total = len(followers)

        for uid, f in followers.items():
            # Bot logic: 0 followers and high following
            if f.follower_count == 0 and f.following_count > 500:
                bots += 1
            # Ghost: No media
            elif f.media_count == 0:
                ghosts += 1
            # Suspicious: High following, low followers
            elif f.following_count > 2000 and f.follower_count < 100:
                suspicious += 1

        real = max(0, total - bots - ghosts - suspicious)
        
        # Percentages calculate karein
        bot_pct = round((bots / total) * 100) if total else 0
        real_pct = round((real / total) * 100) if total else 0
        
        # Credibility Score (Cyber Security Style)
        credibility = max(10, min(98, real_pct - (bot_pct * 1.5)))

        # 4. Engagement Analysis (Last 5 Posts)
        medias = cl.user_medias(user.pk, amount=5)
        avg_likes = 0
        avg_comments = 0
        if medias:
            avg_likes = round(sum(m.like_count for m in medias) / len(medias))
            avg_comments = round(sum(m.comment_count for m in medias) / len(medias))

        eng_rate = round(((avg_likes + avg_comments) / followers_count) * 100, 2) if followers_count else 0

        # Security Labels for Frontend
        if credibility > 75:
            status_label = "SECURE"
            status_color = "#00e676" # Green
        elif credibility > 45:
            status_label = "WARNING"
            status_color = "#ffeb3b" # Yellow
        else:
            status_label = "RISKY / BOT"
            status_color = "#ff5252" # Red

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
        print(f"❌ Error during analysis: {error_msg}")
        
        if "rate limit" in error_msg.lower():
            return jsonify({"error": "Instagram Rate Limit reached. Try again in 15 mins."}), 429
        return jsonify({"error": "Account not found or Security Bypass failed."}), 400

@app.route('/')
def home():
    return "🛡️ Asad Lee's Insta-Scan API is Online."

# Vercel ko app object chahiye hota hai
if __name__ == '__main__':
    app.run(port=5000, debug=True)