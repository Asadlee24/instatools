from flask import Flask, jsonify, request
from flask_cors import CORS
from instagrapi import Client

app = Flask(__name__)
CORS(app)

# ============================
# YAHAN APNA INSTAGRAM ACCOUNT
# USERNAME AUR PASSWORD LIKHO
# (Naya burner account banao)
# ============================
INSTAGRAM_USERNAME = "joyboy3098"
INSTAGRAM_PASSWORD = "Asadaly24@."
FOLLOWER_SAMPLE_LIMIT = 100

print("Instagram se connect ho raha hai...")
cl = Client()

try:
    cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
    print("✅ Login successful!")
except Exception as e:
    print(f"❌ Login failed: {e}")


@app.route('/analyze/<username>')
def analyze(username):
    try:
        print(f"Analyzing: {username}")

        # Basic profile info lo
        user = cl.user_info_by_username(username)

        followers_count = user.follower_count
        following_count = user.following_count
        posts_count = user.media_count

        # 200 followers sample lo analysis ke liye
        print("Followers fetch ho rahe hain...")
        followers = cl.user_followers(user.pk, amount=FOLLOWER_SAMPLE_LIMIT)

        bots = 0
        ghosts = 0
        suspicious = 0
        total = len(followers)

        for uid, f in followers.items():
            # Bot signs: 0 followers, 1000+ following, no posts
            if f.follower_count == 0 and f.following_count > 500:
                bots += 1
            # Ghost: no postazs aur no profile pic
            elif f.media_count == 0:
                ghosts += 1
            # Suspicious: following count bahut zyada
            elif f.following_count > 2000 and f.follower_count < 100:
                suspicious += 1

        real = max(0, total - bots - ghosts - suspicious)

        bot_pct     = round(bots / total * 100) if total else 0
        ghost_pct   = round(ghosts / total * 100) if total else 0
        susp_pct    = round(suspicious / total * 100) if total else 0
        real_pct    = round(real / total * 100) if total else 0

        # Credibility score calculate karo
        credibility = max(10, min(95, real_pct - bot_pct * 2))

        # Last posts ki engagement
        medias = cl.user_medias(user.pk, amount=6)
        avg_likes = 0
        avg_comments = 0
        likes_list = []

        if medias:
            avg_likes    = round(sum(m.like_count for m in medias) / len(medias))
            avg_comments = round(sum(m.comment_count for m in medias) / len(medias))
            likes_list   = [m.like_count for m in medias]

        # Engagement rate
        eng_rate = round((avg_likes + avg_comments) / followers_count * 100, 2) if followers_count else 0

        return jsonify({
            "username":         user.username,
            "full_name":        user.full_name,
            "bio":              user.biography,
            "followers":        followers_count,
            "following":        following_count,
            "posts":            posts_count,
            "is_verified":      user.is_verified,
            "profile_pic":      str(user.profile_pic_url),
            "real_followers_pct":  real_pct,
            "bot_followers_pct":   bot_pct,
            "ghost_followers_pct": ghost_pct,
            "suspicious_pct":      susp_pct,
            "credibility_score":   credibility,
            "engagement_rate":     eng_rate,
            "avg_likes":           avg_likes,
            "avg_comments":        avg_comments,
            "last_posts_likes":    likes_list,
            "account_quality":     "Verified" if user.is_verified else ("Suspicious" if credibility < 40 else "Normal"),
            "growth_trend":        "bought" if bot_pct > 30 else ("growing" if eng_rate > 4 else "stable"),
            "account_age_years":   1,
            "posts_per_week":      round(posts_count / 52, 1),
        })

    except Exception as e:
        message = str(e)
        print(f"Error: {message}")

        if "Please wait a few minutes" in message or "try again later" in message.lower() or "rate limit" in message.lower():
            message = "Instagram ne rate limit laga di hai. Thodi der baad dubara try karo."
        elif "challenge_required" in message.lower() or "checkpoint" in message.lower():
            message = "Instagram ne additional verification maangi hai. Account browser/mobil par check karo."

        return jsonify({"error": message}), 400


@app.route('/')
def home():
    return "✅ Insta Analyzer Backend chal raha hai!"


if __name__ == '__main__':
    print("🚀 Server start ho raha hai port 5000 pe...")
    app.run(port=5000, debug=True)

