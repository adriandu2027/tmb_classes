from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/members")
def members():
    return jsonify({"members": ["Member1", "Member2", "Member3"]})

if __name__ == "__main__":
    app.run(debug=True, port = 5555)
