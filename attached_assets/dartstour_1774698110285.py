from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
import json, os, random, requests

app = Flask(__name__)
app.secret_key = "180_maximum_secret"

SAVE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "darts_save.json")

class PDCCareer:
    def __init__(self, name):
        self.spieler_name = name
        self.hat_tourcard = False
        self.q_school_punkte = 0
        self.order_of_merit_geld = 0
        self.bank_konto = 2500
        self.bot_form = {}
        self.h2h = {} 
        self.aktiver_sponsor = None
        self.letzte_schlagzeile = None
        
        self.aktuelles_turnier_index = 0
        self.saison_jahr = 1
        self.turnier_laeuft = False
        self.aktuelle_runde = 0
        self.gegner_name = ""
        self.gegner_avg = 0.0
        self.stats_spiele = 0
        self.stats_siege = 0
        
        self.stats_legs_won = 0
        self.stats_legs_lost = 0
        self.stats_180s = 0
        self.stats_highest_finish = 0
        self.stats_avg_history = [] 
        self.stats_checkout_percent_history = [] 
        
        self.turnier_baum = []
        
        self.walk_on_videos = {
            "Michael van Gerwen": "zaJ1AC4wT3Y",
            "Gerwyn Price": "HbDDzJvGguc",
            "Luke Littler": "I66tENw1feA"
        }
        
        self.achievements = {
            "first_win": {"name": "Erstes Blut", "desc": "Gewinne dein allererstes Match.", "unlocked": False},
            "tourcard": {"name": "Profi-Status", "desc": "Sichere dir die PDC Tourcard.", "unlocked": False},
            "first_title": {"name": "Silberzeug!", "desc": "Gewinne dein erstes Turnier.", "unlocked": False},
            "top64": {"name": "Etabliert", "desc": "Erreiche die Top 64 der Welt.", "unlocked": False},
            "top16": {"name": "Elite", "desc": "Erreiche die Top 16 der Welt.", "unlocked": False},
            "first_180": {"name": "Maximum!", "desc": "Wirf deine erste 180 im Match.", "unlocked": False},
            "ton_finish": {"name": "Ton Plus", "desc": "Checke ein Finish von 100 oder höher.", "unlocked": False},
            "big_fish": {"name": "The Big Fish", "desc": "Checke die magische 170.", "unlocked": False}
        }
        
        self.kalender = [
            {"name": "Players Championship 1", "typ": "ProTour", "format": "legs"},
            {"name": "UK Open", "typ": "Major", "min_platz": 128, "format": "legs"}, 
            {"name": "Premier League Night", "typ": "Major", "min_platz": 8, "format": "legs"},
            {"name": "Players Championship 2", "typ": "ProTour", "format": "legs"},
            {"name": "World Matchplay", "typ": "Major", "min_platz": 16, "format": "legs"},
            {"name": "World Grand Prix", "typ": "Major", "min_platz": 32, "format": "sets"},
            {"name": "PDC World Championship", "typ": "Major", "min_platz": 96, "format": "sets"}
        ]
        
        self.bot_rangliste = [
            {"name": "Luke Humphries", "geld": 1400000}, {"name": "Michael van Gerwen", "geld": 1000000}, 
            {"name": "Michael Smith", "geld": 850000}, {"name": "Gerwyn Price", "geld": 650000}, 
            {"name": "Nathan Aspinall", "geld": 500000}, {"name": "Luke Littler", "geld": 350000}
        ]
        
        basis_geld = 200000
        for i in range(7, 129):
            basis_geld = int(basis_geld * 0.94)
            self.bot_rangliste.append({"name": f"Profi-Bot {i}", "geld": basis_geld})
            
        self.qschool_spieler = ["Fallon Sherrock", "Max Hopp", "John Henderson", "Corey Cadby"]
        self.lade_spielstand()

    def speichere_spielstand(self):
        d = self.__dict__.copy()
        with open(SAVE_FILE, "w") as f: json.dump(d, f)

    def lade_spielstand(self):
        if os.path.exists(SAVE_FILE):
            with open(SAVE_FILE, "r") as f:
                d = json.load(f)
                for k, v in d.items(): 
                    if k in self.__dict__: setattr(self, k, v)
        if not hasattr(self, 'stats_checkout_percent_history'): self.stats_checkout_percent_history = []
        if not hasattr(self, 'walk_on_videos'): self.walk_on_videos = {"Michael van Gerwen": "zaJ1AC4wT3Y", "Gerwyn Price": "HbDDzJvGguc", "Luke Littler": "I66tENw1feA"}
        if not hasattr(self, 'h2h'): self.h2h = {}

    def ermittle_platz(self):
        alle = sorted(self.bot_rangliste + [{"name": self.spieler_name, "geld": self.order_of_merit_geld}], key=lambda x: x["geld"], reverse=True)
        for i, s in enumerate(alle):
            if s["name"] == self.spieler_name: return i + 1
        return 129

    def get_runden_info(self):
        runden_namen = {128: "Letzte 128", 64: "Letzte 64", 32: "Letzte 32", 16: "Achtelfinale", 8: "Viertelfinale", 4: "Halbfinale", 2: "Finale"}
        aktuell = len(self.turnier_baum) if self.turnier_baum else 128
        name = runden_namen.get(aktuell, f"Runde {self.aktuelle_runde + 1}")
        
        if not self.hat_tourcard: return {"name": name, "first_to": 5, "format": "legs"}
            
        t = self.kalender[self.aktuelles_turnier_index]
        format_typ = t.get("format", "legs")

        if t["name"] == "Premier League Night": return {"name": name, "first_to": 6, "format": "legs"}

        if format_typ == "sets":
            if aktuell >= 64: first_to = 3
            elif aktuell >= 16: first_to = 4
            elif aktuell >= 4: first_to = 5
            else: first_to = 7
            return {"name": name, "first_to": first_to, "format": "sets"}
        else:
            if t["typ"] == "ProTour": first_to = 6 if aktuell >= 8 else (7 if aktuell == 4 else 8)
            else: first_to = 10 if aktuell >= 8 else (13 if aktuell == 4 else 18)
            return {"name": name, "first_to": first_to, "format": "legs"}

    def _get_bot_avg(self, name):
        alle_bots = sorted(self.bot_rangliste, key=lambda x: x["geld"], reverse=True)
        form_bonus = self.bot_form.get(name, 0.0)
        try:
            rank = [b["name"] for b in alle_bots].index(name)
            if rank < 16: base = random.randint(95, 105) 
            elif rank < 64: base = random.randint(86, 94)
            else: base = random.randint(76, 85)
        except ValueError:
            base = random.randint(65, 75) 
        return round(base + form_bonus, 1)

    def generiere_gegner(self):
        if self.aktuelle_runde == 0 or not self.turnier_baum:
            if not self.hat_tourcard:
                size = 128
                pool = self.qschool_spieler + [f"Amateur {i}" for i in range(1, 128)]
                random.shuffle(pool)
                pool = pool[:127]
            else:
                t = self.kalender[self.aktuelles_turnier_index]
                if t["name"] in ["World Matchplay", "World Grand Prix"]: size = 32
                elif t["name"] == "Premier League Night": size = 8
                else: size = 128
                
                alle_bots = sorted(self.bot_rangliste, key=lambda x: x["geld"], reverse=True)
                if size == 8: pool = [b["name"] for b in alle_bots[:7]]
                elif size == 32: pool = [b["name"] for b in alle_bots[:31]]
                else: pool = [b["name"] for b in self.bot_rangliste]
                
                random.shuffle(pool)
                pool = pool[:size-1]
                
            bots = [{"name": n, "avg": self._get_bot_avg(n)} for n in pool]
            self.turnier_baum = [{"name": self.spieler_name, "avg": 0}] + bots
            
            random.shuffle(self.turnier_baum)

        try:
            idx = next(i for i, p in enumerate(self.turnier_baum) if p["name"] == self.spieler_name)
            opp_idx = idx + 1 if idx % 2 == 0 else idx - 1
            gegner = self.turnier_baum[opp_idx]
            
            self.gegner_name = gegner["name"]
            base_avg = gegner["avg"]
            tagesform_faktor = random.uniform(0.9, 1.1)
            self.gegner_avg = round(base_avg * tagesform_faktor, 1)
        except StopIteration:
            pass 

    def check_unlocks(self):
        msgs = []
        platz = self.ermittle_platz()
        if platz <= 64 and not self.achievements["top64"]["unlocked"]:
            self.achievements["top64"]["unlocked"] = True
            msgs.append("⭐ Achievement: Etabliert! Du bist in den Top 64!")
        if platz <= 16 and not self.achievements["top16"]["unlocked"]:
            self.achievements["top16"]["unlocked"] = True
            msgs.append("⭐ Achievement: Elite! Du bist in den Top 16!")
        return msgs

    def generiere_schlagzeile(self, turnier, runde, sieg, avg, sieger=None):
        if sieg:
            titel = random.choice([f"🏆 SENSATION: {self.spieler_name} gewinnt {turnier}!", f"🎯 Unaufhaltsam! {self.spieler_name} krönt sich zum Champion.", f"👑 Darts-Wahnsinn! Turniersieg für {self.spieler_name}!"])
            text = f"Was für ein Auftritt! Mit einem starken Average von {avg} im Finale sichert sich {self.spieler_name} das Preisgeld und sendet eine Schockwelle durch die Order of Merit."
        else:
            sieger_text = f" Das Turnier gewann am Ende übrigens {sieger}." if sieger else ""
            if runde in ["Letzte 128", "Letzte 64", "Runde 1", "Runde 2"]:
                titel = random.choice([f"🗞️ Enttäuschung pur: {self.spieler_name} scheitert früh bei {turnier}.", f"📉 Koffer packen: Erst-Runden-Aus für {self.spieler_name}.", f"✈️ Kurzer Ausflug: {turnier} endet nach schwachem Auftritt."])
                text = f"Da war mehr drin. Nach dem frühen Aus in der Runde '{runde}' (Average: {avg}) hagelt es Kritik von den Experten. Ab ans Practice Board!{sieger_text}"
            else:
                titel = random.choice([f"🗞️ Starker Run endet: {self.spieler_name} scheidet aus.", f"💔 Herzschlagfinale! {self.spieler_name} verpasst den Titel knapp.", f"🎯 Respektabler Auftritt, Endstation in {runde}."])
                text = f"Ein gutes Turnier nimmt ein bitteres Ende bei {turnier}. Mit einem Average von {avg} war heute einfach nicht mehr drin.{sieger_text}"
        self.letzte_schlagzeile = {"titel": titel, "text": text}

    def process_result(self, legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct=0.0):
        msgs = []
        win = legs_won > legs_lost 
        gegner_name = self.gegner_name
        
        self.stats_spiele += 1
        self.stats_legs_won += legs_won
        self.stats_legs_lost += legs_lost
        self.stats_180s += my_180s
        if my_avg > 0: self.stats_avg_history.append(my_avg)
        if my_hf > self.stats_highest_finish: self.stats_highest_finish = my_hf
        if my_co_pct > 0: self.stats_checkout_percent_history.append(my_co_pct)
        
        if gegner_name not in self.h2h:
            self.h2h[gegner_name] = {"siege": 0, "niederlagen": 0}
        if win: self.h2h[gegner_name]["siege"] += 1
        else: self.h2h[gegner_name]["niederlagen"] += 1
        
        neuer_baum = []
        for i in range(0, len(self.turnier_baum), 2):
            bot1 = self.turnier_baum[i]
            bot2 = self.turnier_baum[i+1]
            
            if bot1["name"] == self.spieler_name or bot2["name"] == self.spieler_name:
                spieler_bot = bot1 if bot1["name"] == self.spieler_name else bot2
                gegner_bot = bot2 if bot1["name"] == self.spieler_name else bot1
                neuer_baum.append(spieler_bot if win else gegner_bot)
            else:
                bot1_match_avg = bot1["avg"] * random.uniform(0.9, 1.1)
                bot2_match_avg = bot2["avg"] * random.uniform(0.9, 1.1)
                chance_bot1 = max(0.1, min(0.9, 0.5 + (bot1_match_avg - bot2_match_avg) * 0.02)) 
                
                if random.random() < chance_bot1: winner, loser = bot1, bot2
                else: winner, loser = bot2, bot1
                    
                neuer_baum.append(winner)
                self.bot_form[winner["name"]] = min(5.0, self.bot_form.get(winner["name"], 0.0) + 0.5)
                self.bot_form[loser["name"]] = max(-5.0, self.bot_form.get(loser["name"], 0.0) - 0.5)
                
        self.turnier_baum = neuer_baum
        msgs.append(f"📊 Ergebnis eingetragen: {legs_won} : {legs_lost}")
        
        turnier_sieger = None
        if not win and self.hat_tourcard:
            sim_baum = self.turnier_baum.copy()
            while len(sim_baum) > 1:
                next_b = []
                for i in range(0, len(sim_baum), 2):
                    b1 = sim_baum[i]; b2 = sim_baum[i+1]
                    c1 = max(0.1, min(0.9, 0.5 + ((b1["avg"]*1.0) - (b2["avg"]*1.0)) * 0.02))
                    next_b.append(b1 if random.random() < c1 else b2)
                sim_baum = next_b
            turnier_sieger = sim_baum[0]["name"]

        if self.aktiver_sponsor:
            if self.aktiver_sponsor["ziel_typ"] == "180s": self.aktiver_sponsor["aktuell"] += my_180s
            elif self.aktiver_sponsor["ziel_typ"] == "siege" and win: self.aktiver_sponsor["aktuell"] += 1
            elif self.aktiver_sponsor["ziel_typ"] == "hf" and my_hf >= self.aktiver_sponsor["ziel_wert"]: self.aktiver_sponsor["aktuell"] = self.aktiver_sponsor["ziel_wert"]
                
            if self.aktiver_sponsor["aktuell"] >= self.aktiver_sponsor["ziel_wert"]:
                bonus = self.aktiver_sponsor["belohnung"]
                self.bank_konto += bonus
                msgs.append(f"🤝 ZIEL ERREICHT! {self.aktiver_sponsor['name']} zahlt dir deinen Sponsoren-Bonus von £{bonus:,}.")
                self.aktiver_sponsor = None

        if my_180s > 0 and not self.achievements["first_180"]["unlocked"]:
            self.achievements["first_180"]["unlocked"] = True
            msgs.append("🎯 ONE HUNDRED AND EIGHTY! Deine erste 180 geworfen!")
        if my_hf >= 100 and not self.achievements["ton_finish"]["unlocked"]:
            self.achievements["ton_finish"]["unlocked"] = True
            msgs.append("🎯 Ton Plus! Starkes High-Finish!")

        if win:
            if not self.achievements["first_win"]["unlocked"]:
                self.achievements["first_win"]["unlocked"] = True
                msgs.append("⭐ Erstes Blut! Du hast dein allererstes Match gewonnen.")
            self.stats_siege += 1
            
            if not self.hat_tourcard:
                self.q_school_punkte += 1
                if self.q_school_punkte >= 5: 
                    self.hat_tourcard = True
                    self.achievements["tourcard"]["unlocked"] = True
                    msgs.append("🎯 Tourcard Gewonnen! Willkommen bei den Profis!")
                    self.turnier_laeuft = False
                    self.aktuelle_runde = 0
                    self.turnier_baum = [] 
                else:
                    self.aktuelle_runde += 1
                    self.generiere_gegner()
            else:
                self.aktuelle_runde += 1
                t = self.kalender[self.aktuelles_turnier_index]
                
                if len(self.turnier_baum) == 1:
                    geld = 15000 if t["typ"] == "ProTour" else 150000
                    self.order_of_merit_geld += geld
                    self.bank_konto += geld 
                    self.generiere_schlagzeile(t["name"], "Finale", True, my_avg)
                    if not self.achievements["first_title"]["unlocked"]:
                        self.achievements["first_title"]["unlocked"] = True
                        msgs.append("⭐ Silberzeug! Du hast dein erstes Turnier gewonnen.")
                    msgs.append(f"🏆 TURNIERSIEG! {t['name']} gewonnen! Preisgeld: £{geld:,}")
                    self.turnier_laeuft = False
                    self.aktuelle_runde = 0
                    self.turnier_baum = []
                    msgs.extend(self.next_turnier())
                else:
                    self.generiere_gegner()
        else:
            if self.hat_tourcard:
                trost_geld = self.aktuelle_runde * 1000
                self.order_of_merit_geld += trost_geld
                self.bank_konto += trost_geld
                msgs.append(f"❌ Ausgeschieden. Preisgeld gesichert: £{trost_geld:,}")
                runden_name = self.get_runden_info()["name"]
                t = self.kalender[self.aktuelles_turnier_index]
                self.generiere_schlagzeile(t["name"], runden_name, False, my_avg, turnier_sieger)
            else:
                msgs.append("❌ Niederlage. Q-School Tag beendet.")
            self.turnier_laeuft = False
            self.aktuelle_runde = 0
            self.turnier_baum = []
            if self.hat_tourcard: msgs.extend(self.next_turnier())
            
        msgs.extend(self.check_unlocks())
        self.speichere_spielstand()
        return msgs

    def next_turnier(self):
        msgs = []
        start = self.aktuelles_turnier_index
        while True:
            self.aktuelles_turnier_index = (self.aktuelles_turnier_index + 1) % len(self.kalender)
            if self.aktuelles_turnier_index == 0: self.saison_jahr += 1
            n = self.kalender[self.aktuelles_turnier_index]
            if "min_platz" not in n or self.ermittle_platz() <= n["min_platz"] or self.aktuelles_turnier_index == start: break

        for bot in self.bot_form: self.bot_form[bot] *= 0.8
            
        if self.aktiver_sponsor:
            self.aktiver_sponsor["turniere_zeit"] -= 1
            if self.aktiver_sponsor["turniere_zeit"] < 0:
                msgs.append(f"📉 Vertrag mit {self.aktiver_sponsor['name']} abgelaufen! Du hast das Ziel nicht geschafft.")
                self.aktiver_sponsor = None
                
        if not self.aktiver_sponsor and self.hat_tourcard and random.random() < 0.4:
            sponsoren = ["Winmau", "Target", "RedDragon", "Unicorn", "L-Style", "Paddy Power"]
            ziele = [{"typ": "180s", "ziel": 10, "belohnung": 2000, "text": "Wirf zehn 180er"}, {"typ": "siege", "ziel": 3, "belohnung": 3500, "text": "Gewinne 3 Matches"}, {"typ": "hf", "ziel": 100, "belohnung": 1500, "text": "Checke 100+ (Highfinish)"}]
            ziel = random.choice(ziele)
            self.aktiver_sponsor = {"name": random.choice(sponsoren), "ziel_typ": ziel["typ"], "ziel_wert": ziel["ziel"], "aktuell": 0, "turniere_zeit": 3, "belohnung": ziel["belohnung"], "text": ziel["text"]}
            msgs.append(f"📝 Angebot von {self.aktiver_sponsor['name']}! Ziel: {self.aktiver_sponsor['text']} in den nächsten 3 Turnieren. Bonus: £{self.aktiver_sponsor['belohnung']}")

        return msgs

karriere = PDCCareer("Dennis")

def get_template_data():
    platz = karriere.ermittle_platz()
    turnier_name = karriere.kalender[karriere.aktuelles_turnier_index]["name"] if karriere.hat_tourcard else f"Q-School (Siege: {karriere.q_school_punkte}/5)"
    quote = round((karriere.stats_siege / karriere.stats_spiele * 100), 1) if karriere.stats_spiele > 0 else 0
    gesamt_avg = round(sum(karriere.stats_avg_history) / len(karriere.stats_avg_history), 2) if karriere.stats_avg_history else 0.0
    gesamt_co = round(sum(karriere.stats_checkout_percent_history) / len(karriere.stats_checkout_percent_history), 2) if karriere.stats_checkout_percent_history else 0.0

    alle = sorted(karriere.bot_rangliste + [{"name": karriere.spieler_name, "geld": karriere.order_of_merit_geld}], key=lambda x: x["geld"], reverse=True)
    oom_top10 = alle[:10]
    
    matchups = []
    if karriere.turnier_baum:
        for i in range(0, len(karriere.turnier_baum), 2):
            if i+1 < len(karriere.turnier_baum):
                matchups.append((karriere.turnier_baum[i], karriere.turnier_baum[i+1]))

    h2h_stats = karriere.h2h.get(karriere.gegner_name, {"siege": 0, "niederlagen": 0})

    return {
        "k": karriere, "platz": platz, "turnier_name": turnier_name, "quote": quote, 
        "oom": oom_top10, "gesamt_avg": gesamt_avg, "gesamt_co": gesamt_co, 
        "runden_info": karriere.get_runden_info(), "matchups": matchups, "h2h_stats": h2h_stats
    }

@app.route("/")
def index():
    data = get_template_data()
    return render_template("index.html", view="dashboard", **data)

@app.route("/match")
def match_screen():
    if not karriere.turnier_laeuft:
        return redirect(url_for('index'))
    data = get_template_data()
    return render_template("index.html", view="match", **data)

@app.route("/start_match")
def start_match():
    if karriere.hat_tourcard and karriere.aktuelle_runde == 0:
        t = karriere.kalender[karriere.aktuelles_turnier_index]
        kosten = 250 if t["typ"] == "ProTour" else 500
        if t["name"] == "Premier League Night": kosten = 0 
        karriere.bank_konto -= kosten
        flash(f"💸 Reise- & Startgebühren bezahlt: -£{kosten}")

    karriere.letzte_schlagzeile = None
    karriere.turnier_laeuft = True
    karriere.generiere_gegner()
    karriere.speichere_spielstand()
    return redirect(url_for('match_screen'))

@app.route("/submit_result", methods=["POST"])
def submit_result():
    try: legs_won = int(request.form.get("legs_won") or 0)
    except: legs_won = 0
    try: legs_lost = int(request.form.get("legs_lost") or 0)
    except: legs_lost = 0
    try: my_avg = float(request.form.get("my_avg").replace(",", ".") or 0)
    except: my_avg = 0.0
    try: my_180s = int(request.form.get("my_180s") or 0)
    except: my_180s = 0
    try: my_hf = int(request.form.get("my_hf") or 0)
    except: my_hf = 0
    try: my_co_pct = float(request.form.get("my_co_pct").replace(",", ".") or 0)
    except: my_co_pct = 0.0

    if legs_won == 0 and legs_lost == 0:
        flash("Bitte gib ein gültiges Ergebnis ein!")
        return redirect(url_for('match_screen'))

    messages = karriere.process_result(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct)
    for msg in messages: flash(msg)
    
    if karriere.turnier_laeuft:
        return redirect(url_for('match_screen'))
    else:
        return redirect(url_for('index'))

# ==========================================
# Autodarts-Abruf (REST API)
# ==========================================

AUTODARTS_API_URL = "https://api.autodarts.io/as/v0/matches/filter?size=10&page=0&sort=-finished_at"

# HIER IST DEIN TOKEN DIREKT EINGEBAUT!
AUTODARTS_BEARER_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkTmtvV253VjRRZEpTTlF2a1FGTTEyMm1RUU8zdVJ0R0ZHX3NwUUtwWUpZIn0.eyJleHAiOjE3NzQ2OTMwMDQsImlhdCI6MTc3NDY5MjcwNCwiYXV0aF90aW1lIjoxNzc0NjgyODM2LCJqdGkiOiI1MzkzMWY4Yi1lMzNkLTQ3YzUtOTMzZS1mNjQxZDVlM2JlZTIiLCJpc3MiOiJodHRwczovL2xvZ2luLmF1dG9kYXJ0cy5pby9yZWFsbXMvYXV0b2RhcnRzIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjFkNWI4MzEwLTA2MDMtNGM4YS1hOWMzLWM2YmI5ZmQ3ZWU0MSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImF1dG9kYXJ0cy1wbGF5Iiwibm9uY2UiOiI3OGQ3YTNkOS00NTM5LTRhYjEtYTk4YS02NGJjYjAyO…uaXMgU21hcnJhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic21hcnJhZGluaG8iLCJnaXZlbl9uYW1lIjoiRGVubmlzIiwiZmFtaWx5X25hbWUiOiJTbWFycmEiLCJlbWFpbCI6ImQuc21hcnJhQGdvb2dsZW1haWwuY29tIn0.zELEPyAcNWIgB1QTE7HOxs-ycFbXwoDj5EjYyJvntUYmE1HZUV8sNIO1s7cNmDkNsme9Ft2GOvCgIGRl2QaHhXStBFPnnjky5HI4qyUWNKh0t438U2Yi5L6uHyyQDpYvi_wYt8aekpMPOt3BZaxeOobga74TETcLaZPSV8rblqr4OMVYPDBTt7an74TpKbf0ADNJ9L5QHzo6TRSwYvPo8ksXdSs43bbdu0yuuGZGDI2q3nim2GT9SnpQL4-1hR646lrM_OeC4_fTKOGAsCrzuJ8esvvK4SHZ5YtawM1YEird4Kai8JdfYD_6QcAVjNg_SJzT4xyxPUKVd-Oo5pYV-g"

@app.route("/pull_autodarts")
def pull_autodarts():
    if not karriere.turnier_laeuft:
        flash("Es läuft aktuell kein Turnier-Match in der Karriere.")
        return redirect(url_for('index'))

    headers = {
        "Authorization": AUTODARTS_BEARER_TOKEN,
        "Accept": "application/json"
    }
    
    if not headers["Authorization"].startswith("Bearer "):
        headers["Authorization"] = "Bearer " + headers["Authorization"]

    try:
        response = requests.get(AUTODARTS_API_URL, headers=headers)
        
        if response.status_code != 200:
            flash(f"❌ Verbindungsfehler zu Autodarts (Code {response.status_code}). Token abgelaufen oder unvollständig kopiert?")
            return redirect(url_for('match_screen'))
            
        data = response.json()
            
        if isinstance(data, list): matches = data
        elif "items" in data: matches = data["items"]
        elif "matches" in data: matches = data["matches"]
        else: matches = []
            
        if not matches:
            flash("❌ Keine Matches im Autodarts-Profil gefunden.")
            return redirect(url_for('match_screen'))
            
        letztes_match = matches[0] 
        
        spieler_daten = None
        gegner_daten = None
        players = letztes_match.get("players", [])

        for p in players:
            if p.get("name", "").lower() == karriere.spieler_name.lower():
                spieler_daten = p
            else:
                gegner_daten = p

        if spieler_daten and gegner_daten:
            stats = spieler_daten.get("stats", {})
            legs_won = spieler_daten.get("legs", 0)
            legs_lost = gegner_daten.get("legs", 0)
            my_avg = float(stats.get("average", 0.0))
            my_180s = int(stats.get("180s", 0))
            my_hf = int(stats.get("highestFinish", 0))
            my_co_pct = float(stats.get("checkoutPercentage", 0.0))
            
            messages = karriere.process_result(legs_won, legs_lost, my_avg, my_180s, my_hf, my_co_pct)
            for msg in messages: flash(msg)
            flash("✅ Daten erfolgreich von Autodarts importiert!")
            
            if not karriere.turnier_laeuft:
                return redirect(url_for('index'))
                
        else:
            flash("❌ Dein Spielername wurde im letzten Match nicht gefunden.")
            
    except Exception as e:
        flash(f"Fehler beim Abrufen der Daten: {e}")

    return redirect(url_for('match_screen'))

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)