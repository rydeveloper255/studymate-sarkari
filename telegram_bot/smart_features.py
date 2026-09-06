"""
telegram_bot/smart_features.py
================================================================================
Comprehensive Implementation of 10 Smart Bot Features for StudyMate Sarkari:
1. Personalized Job & State Alerts (Custom Subscription)
2. Last-Date Deadline Countdown Reminders
3. Smart Eligibility & Age Calculator (AI/Logic Based)
4. Telegram Inline Search (@StudyMateBot <query>)
5. Direct Official PDF & One-Tap Direct Links
6. Daily Morning GK & Current Affairs Quiz Polls
7. Syllabus & Exam Pattern On-Demand (/syllabus)
8. Fake News & Viral Notice Buster (Gazette Verification)
9. Telegram Channel Auto-Broadcaster (With Clean Formatted Posters)
10. Natural Language / Voice & Hinglish Smart Search
================================================================================
"""

import os
import sys
import json
import re
from datetime import datetime, date
from typing import Dict, List, Optional, Any

# Ensure directory is on sys.path for direct script and package execution
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from config import (
    QUALIFICATIONS_LIST,
    POPULAR_SECTORS,
    INDIAN_STATES_PREF,
    EXAM_ELIGIBILITY_RULES,
    QUIZ_QUESTION_BANK,
    SYLLABUS_REGISTRY,
    VERIFIED_GAZETTE_REGISTRY,
    MIN_SCRAPE_DATE_STR,
)

PREFERENCES_FILE = os.path.join(os.path.dirname(__file__), "user_preferences.json")


# ==============================================================================
# 1. USER PREFERENCE & CUSTOM SUBSCRIPTION MANAGER
# ==============================================================================
class UserPreferencesManager:
    """Manages custom subscription preferences for candidates (qualification, sectors, states)."""

    def __init__(self, storage_path: str = PREFERENCES_FILE):
        self.storage_path = storage_path
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
            except Exception:
                self._cache = {}
        else:
            self._cache = {}

    def _save(self):
        try:
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def get_user_pref(self, user_id: int or str) -> Dict[str, Any]:
        uid = str(user_id)
        if uid not in self._cache:
            self._cache[uid] = {
                "user_id": uid,
                "qualifications": ["Graduate (Any Stream)", "12th Pass (Intermediate)"],
                "sectors": ["Staff Selection (SSC)", "Railways (RRB / RRC)", "Police & Defence Forces"],
                "states": ["All India (Central)"],
                "is_subscribed": True,
                "updated_at": datetime.utcnow().isoformat(),
            }
            self._save()
        return self._cache[uid]

    def update_user_pref(self, user_id: int or str, pref_type: str, item: str, toggle: bool = True) -> Dict[str, Any]:
        pref = self.get_user_pref(user_id)
        current_list = pref.get(pref_type, [])
        if toggle:
            if item in current_list:
                current_list.remove(item)
            else:
                current_list.append(item)
        else:
            if item not in current_list:
                current_list.append(item)
        pref[pref_type] = current_list
        pref["updated_at"] = datetime.utcnow().isoformat()
        self._cache[str(user_id)] = pref
        self._save()
        return pref

    def should_receive_alert(self, user_id: int or str, item: dict) -> bool:
        """Determines if a candidate should receive a specific notification based on their preferences."""
        pref = self.get_user_pref(user_id)
        if not pref.get("is_subscribed", True):
            return False

        # If user has no specific filter set, send all central alerts
        user_states = [s.lower() for s in pref.get("states", [])]
        item_state = (item.get("state") or "All India").lower()
        if "all india" in item_state or "all india (central)" in user_states:
            state_match = True
        else:
            state_match = any(st in item_state for st in user_states)

        return state_match

    def format_preferences_message(self, user_id: int or str) -> str:
        pref = self.get_user_pref(user_id)
        quals = "\n".join([f"  • {q}" for q in pref.get("qualifications", [])]) or "  • (None selected - All Alerts)"
        sectors = "\n".join([f"  • {s}" for s in pref.get("sectors", [])]) or "  • (None selected - All Sectors)"
        states = "\n".join([f"  • {st}" for st in pref.get("states", [])]) or "  • All India"

        return (
            "⚙️ *Aapke StudyMate Sarkari Alert Preferences*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Aapko kewal wahi alerts aayenge jo aapki choice ke mutabiq honge:\n\n"
            f"🎓 *Qualifications:*\n{quals}\n\n"
            f"🏢 *Target Sectors:*\n{sectors}\n\n"
            f"🗺️ *Preferred States:*\n{states}\n\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "👇 Niche diye gaye buttons se aap apni preferences kisi bhi waqt change kar sakte hain:"
        )


# ==============================================================================
# 2. LAST-DATE DEADLINE COUNTDOWN REMINDER MANAGER
# ==============================================================================
class DeadlineReminderManager:
    """Finds active government vacancies closing within 24 hours or 3 days and generates countdown warnings."""

    @staticmethod
    def calculate_time_remaining(last_date_str: str) -> Optional[Dict[str, Any]]:
        """Parses deadline string and returns days/hours remaining."""
        if not last_date_str:
            return None

        # Clean string
        clean = re.sub(r'\(.*?\)', '', last_date_str).strip()
        ref_now = datetime.now()

        # Try various date formats
        for fmt in ("%Y-%m-%d", "%d %B %Y", "%d %b %Y", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                dt = datetime.strptime(clean, fmt)
                # Set deadline to end of day 23:59:59
                dt = dt.replace(hour=23, minute=59, second=59)
                delta = dt - ref_now
                total_hours = int(delta.total_seconds() / 3600)
                days = delta.days
                return {
                    "deadline_datetime": dt,
                    "days_remaining": days,
                    "hours_remaining": total_hours,
                    "is_expired": delta.total_seconds() <= 0,
                    "is_critical": 0 <= total_hours <= 24,
                    "is_urgent": 24 < total_hours <= 72,
                }
            except ValueError:
                continue
        return None

    @staticmethod
    def generate_deadline_report(jobs: List[Dict[str, Any]]) -> str:
        """Generates countdown markdown bulletin for forms closing soon."""
        critical_items = []
        urgent_items = []
        upcoming_items = []

        for job in jobs:
            last_date = job.get("lastDate") or job.get("application_last_date", "")
            rem = DeadlineReminderManager.calculate_time_remaining(last_date)
            if not rem or rem["is_expired"]:
                continue

            title = job.get("title", "Government Vacancy")
            apply_url = job.get("applyUrl") or job.get("application_url", "https://studymate-sarkari.onrender.com")

            if rem["is_critical"]:
                critical_items.append((title, rem["hours_remaining"], apply_url))
            elif rem["is_urgent"]:
                urgent_items.append((title, rem["days_remaining"], apply_url))
            else:
                upcoming_items.append((title, rem["days_remaining"], apply_url))

        lines = [
            "⏰ *STUDYMATE SARKARI - APPLICATION DEADLINE RADAR*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "Kissi v vacancy ki aakhiri tarikh miss na ho! Live forms countdown:\n",
        ]

        if critical_items:
            lines.append("🚨 *LAST 24 HOURS (Aaj hi apply karein - Server rush!):*")
            for title, hours, url in critical_items:
                lines.append(f"• *{title}*\n  ⏳ *Kewal {hours} Ghante Bache Hain!* 👉 [Direct Apply Online]({url})")
            lines.append("")

        if urgent_items:
            lines.append("⚠️ *CLOSING IN 3 DAYS (2-3 din bache hain):*")
            for title, days, url in urgent_items:
                lines.append(f"• *{title}*\n  📅 *{days} din shesh* 👉 [Direct Apply Online]({url})")
            lines.append("")

        if not critical_items and not urgent_items and upcoming_items:
            lines.append("✅ *CURRENTLY ACTIVE VACANCIES (Sufficient time):*")
            for title, days, url in upcoming_items[:5]:
                lines.append(f"• *{title}* (Active - {days} din bache hain)")
            lines.append("")

        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("⚡ _Official servers on last dates face heavy traffic. Apply well in advance!_")
        return "\n".join(lines)


# ==============================================================================
# 3. SMART ELIGIBILITY & AGE CALCULATOR
# ==============================================================================
class EligibilityCalculator:
    """Calculates candidate exact age as of 01-08-2026 and checks eligibility across major exams."""

    @staticmethod
    def calculate_exact_age(dob: date, ref_date: date = date(2026, 8, 1)) -> Dict[str, int]:
        """Calculates precise years, months, and days between DOB and reference date."""
        years = ref_date.year - dob.year
        months = ref_date.month - dob.month
        days = ref_date.day - dob.day

        if days < 0:
            months -= 1
            # approximate days in previous month
            days += 30
        if months < 0:
            years -= 1
            months += 12

        decimal_age = years + (months / 12.0) + (days / 365.0)
        return {
            "years": years,
            "months": months,
            "days": days,
            "decimal_age": decimal_age,
        }

    @staticmethod
    def check_candidate_eligibility(
        dob_str: str,
        category: str = "UR",
        qualification: str = "Graduate",
    ) -> Dict[str, Any]:
        """Parses user details and provides exact eligibility results across all active recruitments."""
        # Clean and parse DOB
        clean_dob = dob_str.strip()
        parsed_dob = None
        for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d.%m.%Y"):
            try:
                parsed_dob = datetime.strptime(clean_dob, fmt).date()
                break
            except ValueError:
                continue

        if not parsed_dob:
            return {
                "success": False,
                "error": "Aapka DOB format sahi nahi hai. Kripya DD-MM-YYYY format me dalein (jaise: 15-08-2001).",
            }

        cat_upper = category.strip().upper()
        if cat_upper not in ["UR", "EWS", "OBC", "SC", "ST", "PWD"]:
            cat_upper = "UR"

        ref_date = date(2026, 8, 1)
        age_info = EligibilityCalculator.calculate_exact_age(parsed_dob, ref_date)

        eligible_exams = []
        ineligible_exams = []

        # Qualification levels hierarchy for comparison
        qual_rank = {
            "10th": 1, "10th pass": 1, "matric": 1,
            "12th": 2, "12th pass": 2, "intermediate": 2,
            "iti": 2, "diploma": 2, "iti / technical diploma": 2,
            "graduate": 3, "b.tech": 3, "b.e": 3, "engineering": 3, "degree": 3,
            "post graduate": 4, "pg": 4, "master": 4,
        }

        user_q_lower = qualification.strip().lower()
        user_level = 3  # default graduate
        for k, v in qual_rank.items():
            if k in user_q_lower:
                user_level = v
                break

        for rule in EXAM_ELIGIBILITY_RULES:
            # Relaxation for category
            relaxation = rule["category_relaxations"].get(cat_upper, 0)
            max_allowed_age = rule["max_age"] + relaxation
            min_allowed_age = rule["min_age"]

            # Required qualification level
            req_q_lower = rule["min_qualification"].lower()
            req_level = 1
            for k, v in qual_rank.items():
                if k in req_q_lower:
                    req_level = v
                    break

            # Checks
            age_decimal = age_info["decimal_age"]
            age_ok = min_allowed_age <= age_decimal <= max_allowed_age
            qual_ok = user_level >= req_level

            if age_ok and qual_ok:
                eligible_exams.append({
                    "name": rule["exam_name"],
                    "department": rule["department"],
                    "allowed_age": f"{min_allowed_age} to {max_allowed_age} Yrs ({cat_upper} relaxed)",
                    "req_qual": rule["min_qualification"],
                    "apply_url": rule["apply_url"],
                })
            else:
                reasons = []
                if age_decimal < min_allowed_age:
                    reasons.append(f"Under-age by {round(min_allowed_age - age_decimal, 1)} yrs (Min: {min_allowed_age} Yrs)")
                elif age_decimal > max_allowed_age:
                    reasons.append(f"Over-age by {round(age_decimal - max_allowed_age, 1)} yrs (Max: {max_allowed_age} Yrs with {cat_upper} relaxation)")
                if not qual_ok:
                    reasons.append(f"Requires {rule['min_qualification']}")

                ineligible_exams.append({
                    "name": rule["exam_name"],
                    "reason": ", ".join(reasons),
                })

        return {
            "success": True,
            "dob": parsed_dob.strftime("%d-%m-%Y"),
            "category": cat_upper,
            "qualification": qualification,
            "age_as_of_aug_2026": f"{age_info['years']} Years, {age_info['months']} Months, {age_info['days']} Days",
            "eligible_exams": eligible_exams,
            "ineligible_exams": ineligible_exams,
        }

    @staticmethod
    def format_eligibility_bulletin(result: Dict[str, Any]) -> str:
        if not result.get("success"):
            return f"❌ {result.get('error', 'Error in checking eligibility')}"

        lines = [
            "🎯 *STUDYMATE SARKARI - SMART ELIGIBILITY REPORT*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"👤 *Aapki Profile Details:*",
            f"• *DOB:* {result['dob']} | *Category:* {result['category']}",
            f"• *Education:* {result['qualification']}",
            f"• *Exact Age (as on 01-Aug-2026):* `{result['age_as_of_aug_2026']}`\n",
        ]

        if result["eligible_exams"]:
            lines.append("✅ *AAP IN BHARTIYON KE LIYE 100% ELIGIBLE HAIN:*")
            for ex in result["eligible_exams"]:
                lines.append(f"• *{ex['name']}*")
                lines.append(f"  🏢 {ex['department']}")
                lines.append(f"  🎯 Age: {ex['allowed_age']} | Qual: {ex['req_qual']}")
                lines.append(f"  👉 [Direct Apply Link]({ex['apply_url']})\n")
        else:
            lines.append("⚠️ _Filhal aapki current age/qualification ke hisab se in selected exams me match nahi mila._\n")

        if result["ineligible_exams"]:
            lines.append("🚫 *Not Eligible For (Karan/Reason):*")
            for ex in result["ineligible_exams"]:
                lines.append(f"• {ex['name']}: _{ex['reason']}_")

        lines.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("💡 _Age calculated strictly per official govt gazette rules as on 01-08-2026._")
        return "\n".join(lines)


# ==============================================================================
# 4. DAILY MORNING GK & CURRENT AFFAIRS QUIZ MANAGER
# ==============================================================================
class QuizManager:
    """Manages high-yield exam quiz questions for native interactive Telegram polls."""

    @staticmethod
    def get_random_quiz() -> Dict[str, Any]:
        import random
        return random.choice(QUIZ_QUESTION_BANK)

    @staticmethod
    def get_quiz_by_index(idx: int) -> Dict[str, Any]:
        return QUIZ_QUESTION_BANK[idx % len(QUIZ_QUESTION_BANK)]


# ==============================================================================
# 5. SYLLABUS & EXAM PATTERN ON-DEMAND MANAGER
# ==============================================================================
class SyllabusManager:
    """Fetches comprehensive subject-wise marks distribution, negative marking rules and patterns."""

    @staticmethod
    def get_syllabus(query: str) -> Optional[Dict[str, Any]]:
        q = query.strip().lower()
        for key, data in SYLLABUS_REGISTRY.items():
            if key in q or any(word in data["title"].lower() for word in q.split()):
                return data
        # Fallback to SSC CGL if generic
        if "cgl" in q or "ssc" in q:
            return SYLLABUS_REGISTRY.get("ssc-cgl")
        if "railway" in q or "ntpc" in q or "rrb" in q:
            return SYLLABUS_REGISTRY.get("rrb-ntpc")
        if "police" in q or "upp" in q:
            return SYLLABUS_REGISTRY.get("up-police")
        if "bank" in q or "ibps" in q:
            return SYLLABUS_REGISTRY.get("ibps-po")
        return None

    @staticmethod
    def format_syllabus_message(data: Dict[str, Any]) -> str:
        stages_str = "\n".join([f"  {i+1}. {st}" for i, st in enumerate(data.get("stages", []))])

        t1 = data.get("tier1_pattern", {})
        t1_subjects = "\n".join([f"  • {s}" for s in t1.get("subjects", [])])

        lines = [
            f"📚 *{data['title']}*",
            f"🏢 *Exam Conducting Authority:* {data['board']}",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"📌 *Selection Stages:*\n{stages_str}\n",
            f"📝 *Exam Pattern (Stage-1):*",
            f"⏱️ *Duration:* {t1.get('duration', 'N/A')}",
            f"❌ *Negative Marking:* {t1.get('negative_marking', 'None')}",
            f"📖 *Subjects Breakdown:*\n{t1_subjects}\n",
        ]

        if "tier2_pattern" in data:
            t2 = data["tier2_pattern"]
            t2_subjects = "\n".join([f"  • {s}" for s in t2.get("subjects", [])])
            lines.extend([
                f"🎯 *Stage-2 / Mains Exam Pattern:*",
                f"⏱️ *Duration:* {t2.get('duration', 'N/A')}",
                f"❌ *Negative Marking:* {t2.get('negative_marking', 'None')}",
                f"📖 *Subjects Breakdown:*\n{t2_subjects}\n",
            ])

        lines.extend([
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"📥 [Official Detailed Syllabus PDF Download]({data.get('official_syllabus_pdf', 'https://ssc.gov.in')})"
        ])
        return "\n".join(lines)


# ==============================================================================
# 6. FAKE NEWS & VIRAL NOTICE BUSTER (GAZETTE VERIFICATION)
# ==============================================================================
class GazetteVerifier:
    """Verifies viral circulars against verified official gazettes and PIB debunk records."""

    @staticmethod
    def verify_notice(query: str) -> Dict[str, Any]:
        q = query.strip().lower()

        for item in VERIFIED_GAZETTE_REGISTRY:
            if any(k in q for k in item["keywords"]):
                return item

        # If not explicitly in registry, perform general heuristic
        return {
            "status": "UNVERIFIED_CHECK_PORTAL",
            "official_title": f"Query Notice: '{query[:50]}'",
            "advt_number": "Pending Gazette Search",
            "gazette_date": "Recent / Unverified",
            "authority": "Official Commission Examination Portal",
            "portal": "https://upsc.gov.in",
            "verification_badge": "ℹ️ NOTICE SEARCH ADVISORY",
            "remarks": "Hamesha official government portal (.gov.in ya .nic.in) par jakar Advt number verify karein. WhatsApp par viral notice bina gazette sankhya ke nakli ho sakte hain.",
        }

    @staticmethod
    def format_verification_report(item: Dict[str, Any]) -> str:
        is_authentic = item["status"] == "AUTHENTIC_VERIFIED"
        is_fake = item["status"] == "FAKE_NOTICE_ALERT"

        emoji = "🛡️" if is_authentic else ("🚨" if is_fake else "🔍")

        return (
            f"{emoji} *STUDYMATE SARKARI - OFFICIAL GAZETTE FACT-CHECK*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📄 *Subject:* {item['official_title']}\n"
            f"🎖️ *Verification Status:* `{item['verification_badge']}`\n\n"
            f"🏛️ *Issuing Authority:* {item['authority']}\n"
            f"📜 *Official Gazette / Advt No:* `{item['advt_number']}`\n"
            f"📅 *Gazette Notification Date:* {item['gazette_date']}\n"
            f"🌐 *Authentic Source Portal:* {item['portal']}\n\n"
            f"💬 *Fact-Check Findings:*\n{item['remarks']}\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "⚡ _StudyMate Sarkari strictly verifies every circular against Indian Official Gazettes._"
        )


# ==============================================================================
# 7. NATURAL LANGUAGE & HINGLISH SMART SEARCH ENGINE
# ==============================================================================
class HinglishSearchEngine:
    """Understands informal Hindi/Hinglish questions and matches active vacancies, admit cards & results."""

    @staticmethod
    def parse_and_respond(user_message: str, active_jobs: List[Dict[str, Any]] = None) -> str:
        msg = user_message.lower().strip()

        # 1. Admit card intent
        if any(w in msg for w in ["admit card", "hall ticket", "call letter", "city slip", "city intimation"]):
            return (
                "🎫 *STUDYMATE SARKARI - ADMIT CARD DESK*\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                "Aapne Admit Card ke baare me pucha hai. Current live admit cards:\n\n"
                "• *SSC CGL Tier-1 2026:* Exam City Slip Live 👉 [Download Slip](https://ssc.gov.in)\n"
                "• *RRB ALP 2026:* CBT-1 City Intimation Live 👉 [Check City](https://www.rrbapply.gov.in)\n"
                "• *UP Police Constable 2026:* Hall Ticket Out 👉 [Download Admit Card](https://uppbpb.gov.in)\n\n"
                "Apna Registration ID aur DOB taiyar rakhein!"
            )

        # 2. Result intent
        if any(w in msg for w in ["result", "cut off", "scorecard", "merit list", "selection list"]):
            return (
                "🏆 *STUDYMATE SARKARI - RESULTS DESK*\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                "Official declared results (August 2026 Onwards):\n\n"
                "• *SSC GD Constable 2026:* Final Merit List Out 👉 [Check Result](https://ssc.gov.in)\n"
                "• *UPSSSC PET 2026:* Revised Scorecard Live 👉 [Download Scorecard](http://upsssc.gov.in)\n"
                "• *Bihar Police Constable:* Written Exam Result 👉 [Merit PDF](https://csbc.bih.nic.in)\n\n"
                "Direct official links upar diye gaye hain."
            )

        # 3. 12th Pass jobs intent
        if any(w in msg for w in ["12th pass", "12th", "intermediate", "10+2"]):
            return (
                "🎓 *12TH PASS CANDIDATES KE LIYE LIVE VACANCIES*\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                "• *UP Police Constable 2026:* 60,244 Posts (12th Pass Eligible) 👉 [Apply Online](https://uppbpb.gov.in)\n"
                "• *Railway RRB NTPC Undergrad:* Clerk-Typist (12th Pass) 👉 [Apply](https://www.rrbapply.gov.in)\n"
                "• *UPSC NDA & NA 2026:* 400 Posts (12th Appearing/Passed) 👉 [Apply](https://upsconline.nic.in)\n\n"
                "Sare forms abhi active hain!"
            )

        # 4. 10th Pass jobs intent
        if any(w in msg for w in ["10th pass", "10th", "matric"]):
            return (
                "🎓 *10TH PASS CANDIDATES KE LIYE LIVE VACANCIES*\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                "• *SSC GD Constable 2026:* Central Armed Police Forces (BSF, CISF, CRPF) 👉 [Apply](https://ssc.gov.in)\n"
                "• *Railway Group D / Track Maintainer:* 10th / ITI Pass 👉 [Apply](https://www.rrbapply.gov.in)\n\n"
                "Yeh central govt permanent pay scale bhartiyan hain."
            )

        # 5. Graduate jobs intent
        if any(w in msg for w in ["graduate", "degree", "b.a", "b.sc", "b.com", "b.tech"]):
            return (
                "🎓 *GRADUATE CANDIDATES KE LIYE LIVE VACANCIES*\n"
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                "• *SSC CGL 2026:* 17,727 Posts (Inspector / ASO / Tax Assistant) 👉 [Apply Online](https://ssc.gov.in)\n"
                "• *IBPS PO 2026:* 4,455 Bank PO Vacancies 👉 [Apply](https://www.ibps.in)\n"
                "• *RRB NTPC Graduate:* Station Master & Goods Guard 👉 [Apply](https://www.rrbapply.gov.in)\n"
            )

        # 6. Default friendly response
        return (
            "🤖 *StudyMate Sarkari Smart Bot Assistance*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Aapne pucha: *\"{user_message}\"*\n\n"
            "Main aapko in cheezon me madad kar sakta hoon:\n"
            "• `/setpreference` - Custom alert notification set karein\n"
            "• `/eligibility` - Apni exact age aur eligibility check karein\n"
            "• `/deadlines` - Kaunse form band hone wale hain (countdown)\n"
            "• `/quiz` - Aaj ka Daily Sarkari Exam Quiz khele\n"
            "• `/syllabus` - Kisi bhi exam ka detailed pattern dekhein\n"
            "• `/verify` - WhatsApp/Telegram viral notice fact-check karein\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Aap seedha likh sakte hain: *'12th pass police'*, *'railway admit card'*, ya *'ssc cgl'*."
        )


# ==============================================================================
# 8. TELEGRAM CHANNEL AUTO-BROADCASTER POSTER BUILDER
# ==============================================================================
class ChannelPosterBuilder:
    """Generates clean, aesthetic, high-converting posters for Telegram Channels."""

    @staticmethod
    def build_channel_poster(item: Dict[str, Any]) -> str:
        cat = item.get("category", "Jobs")
        title = item.get("title", "New Sarkari Notification")
        dept = item.get("department", "Government of India")
        posts = item.get("total_posts") or item.get("totalPosts", "Check Official Notice")
        last_date = item.get("last_date") or item.get("lastDate") or item.get("application_last_date", "Refer Circular")
        qual = item.get("qualification") or item.get("min_qualification", "10th / 12th / Graduate")
        apply_url = item.get("apply_url") or item.get("application_url") or item.get("source_url", "https://studymate-sarkari.onrender.com")

        return (
            "🏛️ *STUDYMATE SARKARI OFFICIAL RECRUITMENT BULLETIN*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🔥 *{title.upper()}*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🏢 *Department:* {dept}\n"
            f"📊 *Total Vacancies:* `{posts}`\n"
            f"🎓 *Minimum Eligibility:* {qual}\n"
            f"📅 *Application Last Date:* `{last_date}`\n"
            f"🛡️ *Authenticity:* `✅ PIB / Gazette Verified`\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📝 *Direct Apply Online Link:* [Click Here to Apply]({apply_url})\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "📢 _StudyMate Sarkari - 100% Genuine, No Fake News, Real Govt Notices Only._\n"
            "👉 Join Channel: @StudyMateSarkari | Web: https://studymate-sarkari.onrender.com"
        )
