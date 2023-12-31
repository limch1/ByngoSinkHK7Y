import pyjson5 as json
import os

with open("goalspy\goaldatafix.json", encoding="utf-8") as f:
    data = json.load(f)
    f.close()

used = []

num = 0
for item in data["goals"]:
    if data["goals"][item]["img1"] in os.listdir("img"):
        if data["goals"][item]["img1"] not in used:
            used.append(data["goals"][item]["img1"])

unused = []
imgs = os.listdir("img")

for img in imgs:
    if img not in used:
        if img not in unused:
            unused.append(img)

print(unused)