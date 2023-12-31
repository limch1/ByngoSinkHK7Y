import pyjson5 as jsonc

def goaltype(goal):
    goal = goal.lower()
    gtype = "misc"
    if "obtain" in goal:
        if " or " in goal or "charm" in goal:
            gtype = "charm" #random
        elif "key" in goal:
            gtype = "key"
        else:
            gtype = "otherrand" #random
    elif "minion" in goal:
        gtype = "charm" #random
    elif "defeat" in goal or "kill" in goal:
        gtype = "kill"
    elif "geo" in goal:
        gtype = "geo"
    elif "requires" in goal:
        gtype = "otherrand" #random
    elif "grubs" in goal:
        gtype = "grub"
    elif "using" in goal:
        gtype = "otherrand" #random
    elif "lore" in goal:
        gtype = "lore" 
    elif "stag" in goal:
        gtype = "stag" #random
    elif "key" in goal:
        gtype = "key"
    return gtype

def getimg(goal, gtype):
    img1 = img2 = img3 = None
    if gtype == "charm":
        if " or " in goal:
            orindex = goal.find(" or ")
            img1 = goal[6:orindex]
            img2 = goal[orindex+4:]
        if "minion" in goal:
            img1 = "Weaversong"
            img2 = "Glowing Womb"
            img3 = "Grimmchild"
    if gtype == "kill":
        if "defeat" in goal.lower():
            if "+" in goal:
                plusindex = goal.find("+")
                img1 = goal[7:plusindex]
                img2 = goal[plusindex+1:]
            else:
                if goal[7].isupper():
                    img1 = goal[7:]
                else:
                    num = 0
                    for i in range(len(goal)):
                        if goal[i].isupper():
                            num += 1
                        if num == 2:
                            break
                    img1 = goal[i:]
        else:
            num = 0
            for i in range(len(goal)):
                if goal[i].isupper():
                    num += 1
                if num == 2:
                    break
                img1 = goal[i:]
    elif gtype == "stag":
        img1 = "stag"
    elif gtype in ["geo", "stag", "lore", "grub"]:
        img1 = gtype.capitalize()

    imgs = [img1, img2, img3]

    for i in range(3):
        if imgs[i] is not None:
            imgs[i] = imgs[i].strip() + ".png"
    return imgs


with open("goalspy\Hollow Knight.jsonc", encoding="utf-8") as f:
    goals = jsonc.load(f)
    f.close()

goaldict = {
    "goals": {
        
    }
}

for outer in goals["Item Randomizer: No Tiebreakers"]["goals"]:
    i = goals["Item Randomizer: No Tiebreakers"]["goals"][outer]["name"]
    gtype = goaltype(i)
    imgs = getimg(i, gtype)
    goaldict["goals"][outer] = {"name": i, "type": gtype, "img1": imgs[0], "img2": imgs[1], "img3": imgs[2]}
    
with open('goalspy\goaldata.json', 'wb') as f:
    jsonc.dump(goaldict, f, indent=4)