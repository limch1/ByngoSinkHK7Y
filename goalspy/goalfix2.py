import pyjson5 as json

with open("goalspy\goaldata.json", encoding="utf-8") as f:
    data = json.load(f)
    f.close()

for item in data["goals"]:
    i = data["goals"][item]["type"]
    if i in ["charms", "key", "otherrand", "stag"]:
        data["goals"][item]["obtain"] = True
    else:
        data["goals"][item]["obtain"] = False

for item in data["goals"]:
    del data["goals"][item]["type"]

with open('goalspy\goaldatafix.json', 'wb') as f:
    json.dump(data, f, indent=4)