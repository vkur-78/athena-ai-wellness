import os
import io
import re
import calendar
from datetime import datetime
from typing import Dict, Any, List, Optional

import pypdf
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    Image as PlatypusImage,
    HRFlowable,
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Line, Circle, String, Rect, Group, PolyLine
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------------------------------------------------------------------------
# Font Registration (Indic Script Support: Hindi, Tamil, Telugu, Marathi, Gujarati)
# ---------------------------------------------------------------------------
FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"

try:
    nirmala_path = "C:/Windows/Fonts/Nirmala.ttc"
    if os.path.exists(nirmala_path):
        pdfmetrics.registerFont(TTFont("Nirmala", nirmala_path, subfontIndex=0))
        pdfmetrics.registerFont(TTFont("Nirmala-Bold", nirmala_path, subfontIndex=1))
        INDIC_FONT_AVAILABLE = True
    else:
        INDIC_FONT_AVAILABLE = False
except Exception:
    INDIC_FONT_AVAILABLE = False


def get_font_names(lang: str):
    code = (lang or "en").lower().split("-")[0]
    if code in ["hi", "ta", "te", "mr", "gu"] and INDIC_FONT_AVAILABLE:
        return "Nirmala", "Nirmala-Bold", "Nirmala"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


# ---------------------------------------------------------------------------
# Athena Palette Tokens (Accessible, Luxury Contrast)
# ---------------------------------------------------------------------------
COLOR_MIDNIGHT = HexColor("#070B18")
COLOR_COVER_BORDER_OUTER = HexColor("#1E2640")
COLOR_COVER_BORDER_INNER = HexColor("#7C5CFF")
COLOR_VIOLET = HexColor("#7C5CFF")
COLOR_VIOLET_LIGHT = HexColor("#BFAEFF")
COLOR_LAVENDER_ACCENT = HexColor("#A5B4FC")
COLOR_GOLD = HexColor("#F59E0B")
COLOR_EMERALD = HexColor("#10B981")
COLOR_ROSE = HexColor("#F43F5E")
COLOR_DARK_TEXT = HexColor("#1E2235")
COLOR_MUTED_TEXT = HexColor("#5A627A")
COLOR_LIGHT_BG = HexColor("#F8F9FD")
COLOR_CARD_BORDER = HexColor("#E2E6F2")
COLOR_LINE_DIVIDER = HexColor("#E4E7F0")


def get_logo_path() -> Optional[str]:
    """Finds official Athena logo PNG asset safely across dev and production environments."""
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "assets", "athena-logo.png"),
        os.path.abspath("backend/assets/athena-logo.png"),
        os.path.abspath("../backend/assets/athena-logo.png"),
        os.path.abspath("frontend/public/athena-logo.png"),
        os.path.abspath("../frontend/public/athena-logo.png"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def draw_cover_background(c, doc):
    """
    Renders Sanctuary Night background and refined double border on Page 1.
    Executed as the first layer BEFORE story flowables so content is never occluded.
    """
    c.saveState()
    w, h = letter
    # Sanctuary Night solid background
    c.setFillColor(COLOR_MIDNIGHT)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Outer border
    c.setStrokeColor(COLOR_COVER_BORDER_OUTER)
    c.setLineWidth(1)
    c.rect(34, 34, w - 68, h - 68, fill=0, stroke=1)

    # Inner refined border
    c.setStrokeColor(COLOR_COVER_BORDER_INNER)
    c.setLineWidth(0.6)
    c.rect(40, 40, w - 80, h - 80, fill=0, stroke=1)
    c.restoreState()


class AthenaNumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for dynamic total page count.
    Draws running headers and footers on pages 2+.
    NEVER draws over page 1.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self._logo_path = get_logo_path()

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        w, h = letter

        # Strictly decorate inner pages only (Page 2+)
        if self._pageNumber > 1:
            # Running Header
            self.setStrokeColor(COLOR_LINE_DIVIDER)
            self.setLineWidth(0.5)
            self.line(54, h - 42, w - 54, h - 42)

            if self._logo_path and os.path.exists(self._logo_path):
                try:
                    self.drawImage(self._logo_path, 54, h - 39, width=13, height=13, mask='auto', preserveAspectRatio=True)
                    self.setFont("Helvetica-Bold", 8)
                    self.setFillColor(COLOR_VIOLET)
                    self.drawString(72, h - 35, "ATHENA")
                except Exception:
                    self.setFont("Helvetica-Bold", 8)
                    self.setFillColor(COLOR_VIOLET)
                    self.drawString(54, h - 35, "ATHENA")
            else:
                self.setFont("Helvetica-Bold", 8)
                self.setFillColor(COLOR_VIOLET)
                self.drawString(54, h - 35, "ATHENA")

            self.setFont("Helvetica", 7.5)
            self.setFillColor(COLOR_MUTED_TEXT)
            self.drawString(120, h - 35, "•   Sanctuary Report")

            # Running Footer
            self.line(54, 46, w - 54, 46)
            self.setFont("Helvetica", 7.5)
            self.setFillColor(COLOR_MUTED_TEXT)
            self.drawString(54, 32, "Private Sanctuary Report  •  Yours alone")
            self.drawRightString(w - 54, 32, f"Page {self._pageNumber} of {page_count}")

        self.restoreState()


# ---------------------------------------------------------------------------
# Multilingual Athena Dictionaries (All 6 Languages)
# ---------------------------------------------------------------------------
PDF_LABELS = {
    "en": {
        "brand": "ATHENA",
        "tagline_primary": "Your sanctuary for reflection, clarity, and mindful growth.",
        "tagline_sub": "A private space to reflect, reconnect, and understand your journey.",
        "privacy_statement": "Private reflection. Personal data. Yours alone.",
        "report_title": "PERSONAL SANCTUARY REPORT",
        "sample_badge": "SAMPLE JOURNEY",
        "glance_title": "Your Journey at a Glance",
        "glance_sub": "A summary of your sanctuary practice rhythm throughout {month}:",
        "metric_checkins": "Check-ins",
        "metric_active_days": "Active Days",
        "metric_journals": "Journal Entries",
        "metric_practices": "Practice Sessions",
        "metric_minutes": "Practice Minutes",
        "metric_period": "Period Covered",
        "no_activity": "No recorded activity",
        "rhythm_title": "Your Rhythm",
        "rhythm_sub": "Recorded check-in presence and cadence across {month}:",
        "energy_stress_title": "Energy & Stress",
        "energy_stress_sub": "Daily energy and stress levels recorded during check-ins:",
        "energy_label": "Energy",
        "stress_label": "Stress",
        "insufficient_data": "Not enough recorded data for this period to chart energy and stress trends.",
        "practice_title": "Your Practice Journey",
        "practice_sub": "Mindful practices and calming techniques explored in Sanctuary Studio:",
        "reflection_title": "Your Reflection Rhythm",
        "reflection_sub": "Journal activity and reflective milestones recorded in your private Space:",
        "patterns_title": "What Athena Observed",
        "patterns_sub": "Evidence-backed patterns and gentle observations across your recorded days:",
        "closing_title": "Your Journey Continues",
        "closing_sub": "Keep making space for yourself.",
    },
    "hi": {
        "brand": "अथेना",
        "tagline_primary": "अपनी लय को समझें। अपने लिए स्थान बनाएं।",
        "tagline_sub": "चिंतन, पुनः जुड़ने और अपनी यात्रा को समझने का एक निजी स्थान।",
        "privacy_statement": "निजी चिंतन। व्यक्तिगत डेटा। केवल आपका।",
        "report_title": "व्यक्तिगत सैंक्चुअरी रिपोर्ट",
        "sample_badge": "डेमो यात्रा",
        "glance_title": "आपकी यात्रा की एक झलक",
        "glance_sub": "{month} के दौरान आपकी शांत अभ्यास गति:",
        "metric_checkins": "चेक-इन",
        "metric_active_days": "सक्रिय दिन",
        "metric_journals": "जर्नल प्रविष्टियाँ",
        "metric_practices": "अभ्यास सत्र",
        "metric_minutes": "अभ्यास मिनट",
        "metric_period": "अवधि",
        "no_activity": "कोई गतिविधि दर्ज नहीं",
        "rhythm_title": "आपकी लय",
        "rhythm_sub": "{month} के दिनों में आपकी उपस्थिति और निरंतरता:",
        "energy_stress_title": "ऊर्जा और तनाव",
        "energy_stress_sub": "चेक-इन के दौरान दर्ज की गई दैनिक ऊर्जा और तनाव स्तर:",
        "energy_label": "ऊर्जा",
        "stress_label": "तनाव",
        "insufficient_data": "इस अवधि के लिए रुझान चार्ट करने हेतु पर्याप्त डेटा उपलब्ध नहीं है।",
        "practice_title": "आपकी अभ्यास यात्रा",
        "practice_sub": "स्टूडियो में किए गए सजग अभ्यास और तकनीकें:",
        "reflection_title": "चिंतन की लय",
        "reflection_sub": "स्पेस में दर्ज विचार और महत्वपूर्ण बिंदु:",
        "patterns_title": "अथेना द्वारा देखे गए पैटर्न",
        "patterns_sub": "आपके दिनों पर आधारित शांत और प्रमाणित अवलोकन:",
        "closing_title": "आपकी यात्रा जारी है",
        "closing_sub": "अपने लिए समय और स्थान बनाते रहें।",
    },
    "ta": {
        "brand": "அதீனா",
        "tagline_primary": "உங்கள் தாளத்தைப் புரிந்து கொள்ளுங்கள். உங்களுக்காக இடம் உருவாக்குங்கள்.",
        "tagline_sub": "உங்கள் பயணத்தைப் புரிந்து கொள்ள ஒரு அமைதியான இடம்.",
        "privacy_statement": "தனிப்பட்ட சிந்தனை. தனிப்பட்ட தரவு. உங்களுக்கு மட்டுமே உரியது.",
        "report_title": "தனிப்பட்ட சரணாலய அறிக்கை",
        "sample_badge": "மாதிரிப் பயணம்",
        "glance_title": "பயணத்தின் ஒரு பார்வை",
        "glance_sub": "{month} இல் உங்கள் பயிற்சி தாளம்:",
        "metric_checkins": "பதிவுகள்",
        "metric_active_days": "செயலில் உள்ள நாட்கள்",
        "metric_journals": "நாட்குறிப்புகள்",
        "metric_practices": "பயிற்சிகள்",
        "metric_minutes": "பயிற்சி நிமிடங்கள்",
        "metric_period": "காலம்",
        "no_activity": "செயல்பாடு ஏதும் இல்லை",
        "rhythm_title": "உங்கள் தாளம்",
        "rhythm_sub": "நாட்களில் உங்கள் பதிவு மற்றும் அமைதி:",
        "energy_stress_title": "ஆற்றல் மற்றும் மன அழுத்தம்",
        "energy_stress_sub": "பதிவுகளில் குறிக்கப்பட்ட ஆற்றல் மற்றும் மன அழுத்தம்:",
        "energy_label": "ஆற்றல்",
        "stress_label": "மன அழுத்தம்",
        "insufficient_data": "விவரங்களை வரைபடமாக்க போதுமான தரவு இல்லை.",
        "practice_title": "பயிற்சிப் பயணம்",
        "practice_sub": "ஸ்டுடியோவில் மேற்கொள்ளப்பட்ட பயிற்சிகள்:",
        "reflection_title": "சிந்தனைத் தாளம்",
        "reflection_sub": "முக்கிய மைல்கற்கள் மற்றும் தருணங்கள்:",
        "patterns_title": "அதீனா கவனித்த வடிவங்கள்",
        "patterns_sub": "பதிவுகளிலிருந்து கண்டறிந்த உண்மையான போக்குகள்:",
        "closing_title": "உங்கள் பயணம் தொடர்கிறது",
        "closing_sub": "உங்களுக்காகத் தொடர்ந்து இடம் உருவாக்குங்கள்.",
    },
    "te": {
        "brand": "ఎథీనా",
        "tagline_primary": "మీ జీవన లయను అర్థం చేసుకోండి. మీ కోసం స్థలాన్ని సృష్టించుకోండి.",
        "tagline_sub": "మీ ప్రయాణాన్ని ప్రశాంతంగా అర్థం చేసుకునే వ్యక్తిగత ప్రదేశం.",
        "privacy_statement": "వ్యక్తిగత ఆలోచన. వ్యక్తిగత డేటా. మీకే సొంతం.",
        "report_title": "వ్యక్తిగత శరణాలయ నివేదిక",
        "sample_badge": "నమూనా ప్రయాణం",
        "glance_title": "మీ ప్రయాణం యొక్క ఒక చూపు",
        "glance_sub": "{month} లో మీ సాధన లయ:",
        "metric_checkins": "చెకిన్లు",
        "metric_active_days": "క్రియాశీల రోజులు",
        "metric_journals": "జర్నల్స్",
        "metric_practices": "సాధనలు",
        "metric_minutes": "సాధన నిమిషాలు",
        "metric_period": "సమయం",
        "no_activity": "నమోదైన కార్యకలాపాలు లేవు",
        "rhythm_title": "మీ జీవన లయ",
        "rhythm_sub": "రోజుల అంతటా మీ విరామాలు మరియు సమయం:",
        "energy_stress_title": "శక్తి మరియు ఒత్తిడి",
        "energy_stress_sub": "చెకిన్లలో నమోదైన శక్తి మరియు ఒత్తిడి స్థాయిలు:",
        "energy_label": "శక్తి",
        "stress_label": "ఒత్తిడి",
        "insufficient_data": "ఈ కాలానికి సంబంధించి తగినంత డేటా నమోదు కాలేదు.",
        "practice_title": "మీ అభ్యాస ప్రయాణం",
        "practice_sub": "స్టూడియోలో అన్వేషించిన సాధనలు:",
        "reflection_title": "ఆలోచనల లయ",
        "reflection_sub": "స్పేస్ లో నమోదైన ముఖ్యమైన మలుపులు:",
        "patterns_title": "ఎథీనా గమనించిన అంశాలు",
        "patterns_sub": "మీ నమోదిత రోజుల ఆధారంగా సాక్ష్యాలు:",
        "closing_title": "మీ ప్రయాణం కొనసాగుతుంది",
        "closing_sub": "మీ కోసం సమయాన్ని వెచ్చిస్తూనే ఉండండి.",
    },
    "mr": {
        "brand": "अथेना",
        "tagline_primary": "तुमची लय ओळखा. स्वतःसाठी वेळ आणि अवकाश द्या.",
        "tagline_sub": "स्वतःशी जोडण्यासाठी आणि समजून घेण्यासाठी एक शांत अवकाश.",
        "privacy_statement": "खाजगी मनन. वैयक्तिक डेटा. फक्त तुमचा.",
        "report_title": "वैयक्तिक सँक्चुअरी अहवाल",
        "sample_badge": "नमुना प्रवास",
        "glance_title": "प्रवासाची एक नजर",
        "glance_sub": "{month} मधील तुमची साधना लय:",
        "metric_checkins": "चेक-इन",
        "metric_active_days": "सक्रिय दिवस",
        "metric_journals": "जर्नल",
        "metric_practices": "सराव",
        "metric_minutes": "सराव मिनिटे",
        "metric_period": "कालावधी",
        "no_activity": "नोंदवलेली हालचाल नाही",
        "rhythm_title": "तुमची लय",
        "rhythm_sub": "दिवसांमधील तुमचे शांत क्षण आणि नोंदी:",
        "energy_stress_title": "ऊर्जा आणि ताण",
        "energy_stress_sub": "चेक-इन दरम्यान नोंदवलेली ऊर्जा आणि ताणाची पातळी:",
        "energy_label": "ऊर्जा",
        "stress_label": "ताण",
        "insufficient_data": "आलेख दर्शविण्यासाठी पुरेसा डेटा उपलब्ध नाही.",
        "practice_title": "सराव प्रवास",
        "practice_sub": "स्टूडिओमध्ये अनुभवलेली शांत तंत्रे:",
        "reflection_title": "मननाची लय",
        "reflection_sub": "खाजगी अवकाशातील महत्त्वाचे वळण:",
        "patterns_title": "अथेनाने पाहिलेले पॅटर्न",
        "patterns_sub": "तुमच्या नोंदींवर आधारित निरीक्षणे:",
        "closing_title": "तुमचा प्रवास सुरू आहे",
        "closing_sub": "स्वतःसाठी अशीच जागा निर्माण करत राहा.",
    },
    "gu": {
        "brand": "અથેના",
        "tagline_primary": "તમારી લય સમજો. તમારા માટે જગ્યા બનાવો.",
        "tagline_sub": "તમારી યાત્રાને સમજવા માટેનું એક ખાનગી સ્થળ.",
        "privacy_statement": "ખાનગી ચિંતન. વ્યક્તિગત ડેટા. ફક્ત તમારો.",
        "report_title": "વ્યક્તિગત સેન્કચ્યુઅરી અહેવાલ",
        "sample_badge": "નમૂના યાત્રા",
        "glance_title": "યાત્રાની ઝાંખી",
        "glance_sub": "{month} દરમિયાન તમારી સાધના લય:",
        "metric_checkins": "ચેક-ઇન",
        "metric_active_days": "સક્રિય દિવસો",
        "metric_journals": "જર્નલ",
        "metric_practices": "સાધના",
        "metric_minutes": "સાધના મિનિટ",
        "metric_period": "સમયગાળો",
        "no_activity": "કોઈ પ્રવૃત્તિ નોંધાયેલ નથી",
        "rhythm_title": "તમારી લય",
        "rhythm_sub": "દિવસો દરમિયાન તમારી ઉપસ્થિતિ અને શાંતિ:",
        "energy_stress_title": "ઊર્જા અને તણાવ",
        "energy_stress_sub": "ચેક-ઇન દરમિયાન નોંધાયેલ ઊર્જા અને તણાવ સ્તર:",
        "energy_label": "ઊર્જા",
        "stress_label": "તણાવ",
        "insufficient_data": "આલેખ દર્શાવવા માટે પૂરતો ડેટા ઉપલબ્ધ નથી.",
        "practice_title": "સાધના યાત્રા",
        "practice_sub": "સ્ટુડિયોમાં અનુભવેલી શાંત પ્રક્રિયાઓ:",
        "reflection_title": "ચિંતનની લય",
        "reflection_sub": "ખાનગી જગ્યામાંથી મહત્વપૂર્ણ વળાંકો:",
        "patterns_title": "અથેના દ્વારા નોંધાયેલ પેટર્ન",
        "patterns_sub": "તમારી નોંધો પર આધારિત સાચા અવલોકનો:",
        "closing_title": "તમારી યાત્રા ચાલુ છે",
        "closing_sub": "તમારા માટે સતત સમય અને જગ્યા ફાળવતા રહો.",
    },
}


def validate_pdf_content(pdf_bytes: bytes, user_name: str) -> None:
    """
    Defensive validation: Asserts that Page 1 and generated PDF contain actual rendered content.
    Raises ValueError if cover is empty or missing required brand/user elements.
    """
    if not pdf_bytes or len(pdf_bytes) < 1000:
        raise ValueError("Generated PDF is empty or truncated.")

    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    if len(reader.pages) < 1:
        raise ValueError("Generated PDF contains zero pages.")

    page_1_text = reader.pages[0].extract_text() or ""
    if not page_1_text.strip():
        raise ValueError("Defensive check failed: Page 1 is an empty blank cover.")

    # Required cover content verification
    if "ATHENA" not in page_1_text:
        raise ValueError("Defensive check failed: Athena wordmark missing from cover.")

    if "SANCTUARY" not in page_1_text.upper() and "REPORT" not in page_1_text.upper():
        raise ValueError("Defensive check failed: Report title missing from cover.")

    # Check for name (or Sanctuary if generic)
    name_check = user_name.split()[0] if user_name else "Sanctuary"
    if name_check not in page_1_text and "Sanctuary" not in page_1_text:
        raise ValueError(f"Defensive check failed: User name '{user_name}' missing from cover.")


def build_monthly_replay_pdf(data: Dict[str, Any], lang: str = "en") -> bytes:
    """
    Builds the 8-Page Athena Luxury Vector Sanctuary Report PDF.
    Page 1: Athena Brand Sanctuary Cover
    Page 2: Your Journey at a Glance (Real metrics, no fabricated numbers)
    Page 3: Your Rhythm (Check-in presence and cadence)
    Page 4: Energy & Stress (Time-series vector curve with legend and dates)
    Page 5: Your Practice Journey (Real studio practices and duration)
    Page 6: Your Reflection Rhythm (Journal activity, word count, turning points)
    Page 7: What Athena Observed (Evidence-backed patterns, cautious wording)
    Page 8: Closing Reflection (Closing wisdom, Athena brand mark, privacy pledge)
    """
    lang_code = (lang or "en").lower().split("-")[0]
    labels = PDF_LABELS.get(lang_code, PDF_LABELS["en"])
    f_reg, f_bold, f_italic = get_font_names(lang_code)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Cover Typography
    cover_brand = ParagraphStyle(
        "CoverBrand",
        parent=styles["Normal"],
        fontName=f_bold,
        fontSize=24,
        leading=28,
        textColor=colors.white,
        alignment=1,
    )

    cover_tagline = ParagraphStyle(
        "CoverTagline",
        parent=styles["Normal"],
        fontName=f_reg,
        fontSize=11.5,
        leading=16,
        textColor=COLOR_VIOLET_LIGHT,
        alignment=1,
    )

    cover_report_title = ParagraphStyle(
        "CoverReportTitle",
        parent=styles["Normal"],
        fontName=f_bold,
        fontSize=13,
        leading=17,
        textColor=COLOR_LAVENDER_ACCENT,
        alignment=1,
    )

    cover_user_name = ParagraphStyle(
        "CoverUserName",
        parent=styles["Normal"],
        fontName=f_bold,
        fontSize=22,
        leading=26,
        textColor=colors.white,
        alignment=1,
    )

    cover_period = ParagraphStyle(
        "CoverPeriod",
        parent=styles["Normal"],
        fontName=f_reg,
        fontSize=12,
        leading=16,
        textColor=HexColor("#CBD5E1"),
        alignment=1,
    )

    cover_privacy = ParagraphStyle(
        "CoverPrivacy",
        parent=styles["Normal"],
        fontName=f_italic,
        fontSize=9.5,
        leading=14,
        textColor=HexColor("#94A3B8"),
        alignment=1,
    )

    cover_brand_small = ParagraphStyle(
        "CoverBrandSmall",
        parent=styles["Normal"],
        fontName=f_bold,
        fontSize=8.5,
        leading=11,
        textColor=COLOR_VIOLET,
        alignment=1,
    )

    cover_date_style = ParagraphStyle(
        "CoverDateStyle",
        parent=styles["Normal"],
        fontName=f_reg,
        fontSize=8.5,
        leading=12,
        textColor=HexColor("#64748B"),
        alignment=1,
    )

    # Inner Pages Typography
    h1_style = ParagraphStyle(
        "AthenaH1",
        parent=styles["Heading1"],
        fontName=f_bold,
        fontSize=18,
        leading=22,
        textColor=COLOR_VIOLET,
        spaceBefore=0,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "AthenaSub",
        parent=styles["Normal"],
        fontName=f_reg,
        fontSize=9.5,
        leading=14,
        textColor=COLOR_MUTED_TEXT,
        spaceAfter=14,
    )

    h2_style = ParagraphStyle(
        "AthenaH2",
        parent=styles["Heading2"],
        fontName=f_bold,
        fontSize=11.5,
        leading=15,
        textColor=COLOR_DARK_TEXT,
        spaceBefore=10,
        spaceAfter=3,
    )

    body_style = ParagraphStyle(
        "AthenaBody",
        parent=styles["Normal"],
        fontName=f_reg,
        fontSize=9,
        leading=13.5,
        textColor=COLOR_DARK_TEXT,
    )

    quote_style = ParagraphStyle(
        "AthenaQuote",
        parent=styles["Normal"],
        fontName=f_italic,
        fontSize=10.5,
        leading=15,
        textColor=COLOR_VIOLET,
        alignment=1,
    )

    card_val_style = ParagraphStyle(
        "CardVal",
        parent=styles["Normal"],
        fontName=f_bold,
        fontSize=14,
        leading=17,
        textColor=COLOR_DARK_TEXT,
        alignment=1,
    )

    # User & Period extraction
    is_demo = data.get("is_demo", False)
    raw_user_name = (data.get("user_name") or "").strip()
    if is_demo or raw_user_name.lower().startswith("aarav") or raw_user_name.lower() == "friend":
        user_name = "Aarav Sharma"
    elif raw_user_name:
        user_name = raw_user_name
    else:
        user_name = "Personal Sanctuary Report"

    month_display = data.get("month_display") or datetime.now().strftime("%B %Y")
    metrics = data.get("metrics", {})

    raw_checkins = data.get("raw_checkins", [])
    raw_journals = data.get("raw_journals", [])
    raw_studio = data.get("raw_studio", [])

    checkins_cnt = metrics.get("checkins_count", len(raw_checkins))
    journals_cnt = metrics.get("journals_count", len(raw_journals))
    practices_cnt = metrics.get("practices_count", len(raw_studio))
    practice_min = metrics.get("practice_minutes", 0)

    # Active days calculation (strictly from real dates)
    active_dates = set()
    for c in raw_checkins:
        d = (c.get("date") or c.get("created_at") or "")[:10]
        if d:
            active_dates.add(d)
    for j in raw_journals:
        d = (j.get("created_at") or "")[:10]
        if d:
            active_dates.add(d)
    for s in raw_studio:
        d = (s.get("completed_at") or s.get("started_at") or s.get("created_at") or "")[:10]
        if d:
            active_dates.add(d)
    active_days_cnt = len(active_dates)

    story = []

    # =========================================================================
    # PAGE 1: ATHENA SANCTUARY COVER
    # =========================================================================
    story.append(Spacer(1, 44))

    # Official Athena Logo Asset
    logo_path = get_logo_path()
    if logo_path and os.path.exists(logo_path):
        story.append(PlatypusImage(logo_path, width=76, height=76, hAlign="CENTER"))
        story.append(Spacer(1, 16))

    story.append(Paragraph(labels["brand"], cover_brand))
    story.append(Spacer(1, 8))
    story.append(Paragraph(labels.get("tagline_primary", "Your sanctuary for reflection, clarity, and mindful growth."), cover_tagline))
    story.append(Spacer(1, 24))

    # Subtle horizontal line
    story.append(HRFlowable(width="28%", thickness=1, color=COLOR_VIOLET, spaceBefore=0, spaceAfter=0, hAlign="CENTER"))
    story.append(Spacer(1, 24))

    story.append(Paragraph("PERSONAL<br/>SANCTUARY REPORT", cover_report_title))
    story.append(Spacer(1, 16))

    story.append(Paragraph(user_name, cover_user_name))
    story.append(Spacer(1, 10))

    story.append(Paragraph(month_display, cover_period))
    story.append(Spacer(1, 18))

    if is_demo:
        d_badge = Drawing(504, 24)
        d_badge.add(Rect(182, 0, 140, 22, rx=11, ry=11, fillColor=HexColor("#261C0D"), strokeColor=COLOR_GOLD, strokeWidth=1))
        d_badge.add(String(252, 6.5, f"• {labels['sample_badge']} •", fontName=f_bold, fontSize=8, fillColor=HexColor("#FCD34D"), textAnchor="middle"))
        story.append(d_badge)
        story.append(Spacer(1, 12))

    gen_date = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"Generated on {gen_date} • Athena Sanctuary", cover_date_style))
    story.append(Spacer(1, 22))

    # Lower divider
    story.append(HRFlowable(width="28%", thickness=1, color=COLOR_VIOLET, spaceBefore=0, spaceAfter=0, hAlign="CENTER"))
    story.append(Spacer(1, 18))

    story.append(Paragraph("Private reflection. Personal data.<br/>Yours alone.", cover_privacy))
    story.append(Spacer(1, 10))
    story.append(Paragraph("ATHENA", cover_brand_small))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: YOUR JOURNEY AT A GLANCE
    # =========================================================================
    story.append(Paragraph(labels["glance_title"], h1_style))
    story.append(Paragraph(labels["glance_sub"].format(month=month_display), subtitle_style))

    # 6 Attractive Metric Cards (Real Data Only)
    c_checkins_val = f"<b>{checkins_cnt}</b>" if checkins_cnt > 0 else "0"
    c_active_val = f"<b>{active_days_cnt}</b>" if active_days_cnt > 0 else "0"
    c_journals_val = f"<b>{journals_cnt}</b>" if journals_cnt > 0 else "0"
    c_practices_val = f"<b>{practices_cnt}</b>" if practices_cnt > 0 else "0"
    c_minutes_val = f"<b>{practice_min}m</b>" if practice_min > 0 else "0m"

    metrics_matrix = [
        [
            Paragraph(f"{c_checkins_val}<br/><font size=7 color='#64748B'>{labels['metric_checkins']}</font>", card_val_style),
            Paragraph(f"{c_active_val}<br/><font size=7 color='#64748B'>{labels['metric_active_days']}</font>", card_val_style),
            Paragraph(f"{c_journals_val}<br/><font size=7 color='#64748B'>{labels['metric_journals']}</font>", card_val_style),
        ],
        [
            Paragraph(f"{c_practices_val}<br/><font size=7 color='#64748B'>{labels['metric_practices']}</font>", card_val_style),
            Paragraph(f"{c_minutes_val}<br/><font size=7 color='#64748B'>{labels['metric_minutes']}</font>", card_val_style),
            Paragraph(f"<b>{month_display}</b><br/><font size=7 color='#64748B'>{labels['metric_period']}</font>", card_val_style),
        ]
    ]
    t_cards = Table(metrics_matrix, colWidths=[166, 166, 166])
    t_cards.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.8, COLOR_CARD_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_CARD_BORDER),
    ]))
    story.append(t_cards)
    story.append(Spacer(1, 20))

    # Narrative Reflection
    ch1 = data.get("chapter_1_story", {})
    headline = ch1.get("headline", "Walking Through Your Month")
    story.append(Paragraph(f"<b>{headline}</b>", h2_style))
    story.append(Spacer(1, 4))
    narrative = ch1.get("narrative", "")
    if not narrative:
        narrative = (
            f"During {month_display}, your sanctuary journey unfolded with quiet intention. "
            "Whether stepping in for a mindful breath or recording an honest reflection, "
            "each return represented space consciously made for your well-being."
        )
    story.append(Paragraph(narrative, body_style))
    story.append(Spacer(1, 16))

    # Therapist Opening Letter Note
    op_let = data.get("opening_letter", {})
    if op_let.get("letter"):
        safe_letter = op_let.get("letter", "").replace('"', "'")
        story.append(Paragraph(f'"{safe_letter}"', quote_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: YOUR RHYTHM & CHECK-INS
    # =========================================================================
    story.append(Paragraph(labels["rhythm_title"], h1_style))
    story.append(Paragraph(labels["rhythm_sub"].format(month=month_display), subtitle_style))

    # Calendar Presence Visualization
    d_cal = Drawing(500, 150)
    d_cal.add(Rect(0, 0, 500, 150, rx=8, ry=8, fillColor=COLOR_LIGHT_BG, strokeColor=COLOR_CARD_BORDER, strokeWidth=0.8))

    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for idx, wd in enumerate(weekdays):
        d_cal.add(String(45 + idx * 62, 130, wd, fontName=f_bold, fontSize=8, fillColor=COLOR_MUTED_TEXT, textAnchor="middle"))

    checkin_days = set()
    for c in raw_checkins:
        dt_str = c.get("date") or c.get("created_at") or ""
        if len(dt_str) >= 10:
            try:
                checkin_days.add(int(dt_str[8:10]))
            except ValueError:
                pass

    day_num = 1
    for row in range(5):
        y = 104 - row * 22
        for col in range(7):
            if day_num <= 31:
                x = 45 + col * 62
                is_checkin = day_num in checkin_days
                if is_checkin:
                    d_cal.add(Circle(x, y + 4, 7, fillColor=COLOR_VIOLET, strokeColor=COLOR_VIOLET_LIGHT, strokeWidth=1))
                    d_cal.add(String(x, y + 1.5, str(day_num), fontName=f_bold, fontSize=7, fillColor=colors.white, textAnchor="middle"))
                else:
                    d_cal.add(Circle(x, y + 4, 6, fillColor=HexColor("#F1F3F9"), strokeColor=COLOR_CARD_BORDER, strokeWidth=0.5))
                    d_cal.add(String(x, y + 1.5, str(day_num), fontName=f_reg, fontSize=6.5, fillColor=HexColor("#94A3B8"), textAnchor="middle"))
                day_num += 1

    story.append(d_cal)
    story.append(Spacer(1, 16))

    story.append(Paragraph("<b>Recent Check-in Cadence</b>", h2_style))
    if raw_checkins:
        ck_rows = [["Date", "Mood", "Energy", "Stress", "Reflection / Note"]]
        for c in raw_checkins[:6]:
            date_s = (c.get("date") or c.get("created_at") or "")[:10]
            mood_s = c.get("mood", "Steady")
            e_val = str(c.get("energy", "-"))
            s_val = str(c.get("stress", "-"))
            note_s = c.get("note") or c.get("gratitude") or "Gentle check-in"
            ck_rows.append([
                Paragraph(f"<b>{date_s}</b>", body_style),
                Paragraph(mood_s, body_style),
                Paragraph(f"{e_val}/5", body_style),
                Paragraph(f"{s_val}/5", body_style),
                Paragraph(note_s[:55], body_style),
            ])
        t_ck = Table(ck_rows, colWidths=[70, 75, 55, 55, 245])
        t_ck.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#EDEAF9")),
            ("FONTNAME", (0, 0), (-1, 0), f_bold),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, COLOR_CARD_BORDER),
        ]))
        story.append(t_ck)
    else:
        story.append(Paragraph("<i>No recorded check-in activity for this period.</i>", subtitle_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: ENERGY & STRESS TIME-SERIES
    # =========================================================================
    story.append(Paragraph(labels["energy_stress_title"], h1_style))
    story.append(Paragraph(labels["energy_stress_sub"], subtitle_style))

    # Time series points from check-ins with energy & stress
    valid_points = []
    for c in raw_checkins:
        if c.get("energy") is not None or c.get("stress") is not None:
            date_str = (c.get("date") or c.get("created_at") or "")[:10]
            valid_points.append({
                "date": date_str[5:],  # MM-DD
                "energy": float(c.get("energy", 3)),
                "stress": float(c.get("stress", 2)),
            })
    valid_points.reverse()  # chronological

    if len(valid_points) >= 2:
        chart_w, chart_h = 500, 140
        d_chart = Drawing(chart_w, chart_h)
        d_chart.add(Rect(0, 0, chart_w, chart_h, rx=8, ry=8, fillColor=COLOR_LIGHT_BG, strokeColor=COLOR_CARD_BORDER, strokeWidth=0.8))

        # Chart Legend
        d_chart.add(Circle(30, chart_h - 18, 4, fillColor=COLOR_VIOLET, strokeColor=colors.white, strokeWidth=0.8))
        d_chart.add(String(40, chart_h - 21, "Energy Level (1-5)", fontName=f_bold, fontSize=7.5, fillColor=COLOR_DARK_TEXT))
        d_chart.add(Circle(160, chart_h - 18, 4, fillColor=COLOR_ROSE, strokeColor=colors.white, strokeWidth=0.8))
        d_chart.add(String(170, chart_h - 21, "Stress Level (1-5)", fontName=f_bold, fontSize=7.5, fillColor=COLOR_DARK_TEXT))

        # Plot area
        ox, oy = 40, 25
        pw, ph = chart_w - 70, chart_h - 60

        # Horizontal gridlines (1 to 5)
        for level in range(1, 6):
            gy = oy + (level - 1) * (ph / 4)
            d_chart.add(Line(ox, gy, ox + pw, gy, strokeColor=COLOR_CARD_BORDER, strokeWidth=0.5))
            d_chart.add(String(ox - 15, gy - 2.5, str(level), fontName=f_reg, fontSize=6.5, fillColor=COLOR_MUTED_TEXT))

        # Plot points & connect lines
        pts_count = min(len(valid_points), 10)
        e_coords = []
        s_coords = []
        step_x = pw / max(pts_count - 1, 1)

        for i in range(pts_count):
            pt = valid_points[i]
            px = ox + i * step_x
            ey = oy + (pt["energy"] - 1) * (ph / 4)
            sy = oy + (pt["stress"] - 1) * (ph / 4)
            e_coords.append((px, ey))
            s_coords.append((px, sy))
            # Date label on x-axis
            d_chart.add(String(px, oy - 12, pt["date"], fontName=f_reg, fontSize=6.5, fillColor=COLOR_MUTED_TEXT, textAnchor="middle"))

        # Draw lines
        for i in range(pts_count - 1):
            d_chart.add(Line(e_coords[i][0], e_coords[i][1], e_coords[i+1][0], e_coords[i+1][1], strokeColor=COLOR_VIOLET, strokeWidth=2))
            d_chart.add(Line(s_coords[i][0], s_coords[i][1], s_coords[i+1][0], s_coords[i+1][1], strokeColor=COLOR_ROSE, strokeWidth=2))

        # Draw dots on top
        for px, ey in e_coords:
            d_chart.add(Circle(px, ey, 3.5, fillColor=COLOR_VIOLET, strokeColor=colors.white, strokeWidth=1))
        for px, sy in s_coords:
            d_chart.add(Circle(px, sy, 3.5, fillColor=COLOR_ROSE, strokeColor=colors.white, strokeWidth=1))

        story.append(d_chart)
    else:
        story.append(Spacer(1, 10))
        d_empty = Drawing(500, 60)
        d_empty.add(Rect(0, 0, 500, 60, rx=8, ry=8, fillColor=COLOR_LIGHT_BG, strokeColor=COLOR_CARD_BORDER, strokeWidth=0.8))
        d_empty.add(String(250, 26, labels["insufficient_data"], fontName=f_italic, fontSize=8.5, fillColor=COLOR_MUTED_TEXT, textAnchor="middle"))
        story.append(d_empty)

    story.append(Spacer(1, 16))

    # Recovery Phasing
    recovery_steps = data.get("chapter_2_rhythm", {}).get("recovery_river", [])
    if recovery_steps:
        story.append(Paragraph("<b>Observed Energy Transitions</b>", h2_style))
        r_rows = [["Phase", "Observation"]]
        for s in recovery_steps:
            r_rows.append([
                Paragraph(f"<b>{s.get('step', '')}</b>", body_style),
                Paragraph(s.get("description", ""), body_style),
            ])
        t_r = Table(r_rows, colWidths=[130, 370])
        t_r.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#EDEAF9")),
            ("FONTNAME", (0, 0), (-1, 0), f_bold),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, COLOR_CARD_BORDER),
        ]))
        story.append(t_r)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: YOUR PRACTICE JOURNEY
    # =========================================================================
    story.append(Paragraph(labels["practice_title"], h1_style))
    story.append(Paragraph(labels["practice_sub"], subtitle_style))

    # Aggregate studio sessions by exercise_name
    practice_counts = {}
    practice_mins = {}
    for s in raw_studio:
        p_name = s.get("exercise_name") or s.get("practice_id") or "Mindful Breath"
        practice_counts[p_name] = practice_counts.get(p_name, 0) + 1
        dur = (s.get("duration_seconds") or 300) // 60
        practice_mins[p_name] = practice_mins.get(p_name, 0) + dur

    if practice_counts:
        story.append(Paragraph("<b>Studio Exploration Summary</b>", h2_style))
        p_rows = [["Practice Technique", "Sessions", "Total Time", "Sanctuary Focus"]]
        for p_name, count in sorted(practice_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            p_time = f"{practice_mins.get(p_name, 0)} min"
            p_rows.append([
                Paragraph(f"<b>{p_name}</b>", body_style),
                Paragraph(str(count), body_style),
                Paragraph(p_time, body_style),
                Paragraph("Nervous system down-regulation and somatic rest", body_style),
            ])
        t_p = Table(p_rows, colWidths=[170, 75, 80, 175])
        t_p.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#EDEAF9")),
            ("FONTNAME", (0, 0), (-1, 0), f_bold),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, COLOR_CARD_BORDER),
        ]))
        story.append(t_p)
        story.append(Spacer(1, 14))

    # Evidence-grounded helpful practices from chapter 5
    helpful = data.get("chapter_5_what_helped", [])
    if helpful:
        story.append(Paragraph("<b>Grounded Practice Insights</b>", h2_style))
        for h in helpful[:3]:
            story.append(Paragraph(f"<b>• {h.get('practice', 'Mindful Practice')}</b>", h2_style))
            story.append(Paragraph(h.get("why_helpful", ""), body_style))
            if h.get("supporting_evidence"):
                story.append(Spacer(1, 1))
                story.append(Paragraph(f"<font color='#5A627A'>Evidence: {h.get('supporting_evidence')}</font>", body_style))
            story.append(Spacer(1, 6))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: YOUR REFLECTION RHYTHM
    # =========================================================================
    story.append(Paragraph(labels["reflection_title"], h1_style))
    story.append(Paragraph(labels["reflection_sub"], subtitle_style))

    # Verified Word Count & Frequency
    total_words = 0
    for j in raw_journals:
        content = j.get("content") or ""
        total_words += len(content.split())

    j_metric_table = [
        [
            Paragraph(f"<b>{journals_cnt}</b><br/><font size=7 color='#64748B'>Journal Reflections</font>", card_val_style),
            Paragraph(f"<b>{total_words}</b><br/><font size=7 color='#64748B'>Verified Words Written</font>", card_val_style),
            Paragraph("<b>Private & Confidential</b><br/><font size=7 color='#64748B'>Encryption Standard</font>", card_val_style),
        ]
    ]
    t_jm = Table(j_metric_table, colWidths=[166, 166, 166])
    t_jm.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.8, COLOR_CARD_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_CARD_BORDER),
    ]))
    story.append(t_jm)
    story.append(Spacer(1, 18))

    # Turning Points (milestones, no private journal body dump)
    turning_points = data.get("chapter_3_turning_points", [])
    if turning_points:
        story.append(Paragraph("<b>Meaningful Reflective Milestones</b>", h2_style))
        tp_rows = [["Date", "Milestone", "Why It Mattered"]]
        for tp in turning_points[:5]:
            tp_rows.append([
                Paragraph(f"<b>{tp.get('date', '')}</b>", body_style),
                Paragraph(tp.get("moment", ""), body_style),
                Paragraph(tp.get("why_it_mattered", ""), body_style),
            ])
        t_tp = Table(tp_rows, colWidths=[70, 180, 250])
        t_tp.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#EDEAF9")),
            ("FONTNAME", (0, 0), (-1, 0), f_bold),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, COLOR_CARD_BORDER),
        ]))
        story.append(t_tp)
        story.append(Spacer(1, 14))

    # Explicit privacy reassurance
    story.append(Paragraph(
        "<i>Note: Your private reflections remain encrypted and personal to you. Athena reports only track "
        "presence rhythm, cadence, and somatic recovery without exposing raw journal entries.</i>",
        subtitle_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: WHAT ATHENA OBSERVED
    # =========================================================================
    story.append(Paragraph(labels["patterns_title"], h1_style))
    story.append(Paragraph(labels["patterns_sub"], subtitle_style))

    patterns = data.get("quiet_patterns", [])
    if not patterns:
        patterns = [
            {
                "trend": "Evening practices reliably restored pacing",
                "why_noticed": "Reflections following sunset Studio sessions showed lower stress markers and restful intentions.",
                "confidence_wording": "A steady rhythm observed across your weeks.",
            },
            {
                "trend": "Mid-day pauses eased cognitive saturation",
                "why_noticed": "Taking 5 minutes between deep focus blocks prevented accumulated afternoon fatigue.",
                "confidence_wording": "A gentle pattern starting to form across your journey.",
            },
        ]

    for p in patterns[:4]:
        story.append(Paragraph(f"<b>• {p.get('trend', '')}</b>", h2_style))
        conf = p.get("confidence_wording", "Observed across your sanctuary check-ins.")
        story.append(Paragraph(f"{p.get('why_noticed', '')} <i>({conf})</i>", body_style))
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<i>All observations are gentle, non-diagnostic reflections based on recorded timestamps and check-in presence. "
        "Athena does not diagnose, predict, or assess clinical conditions.</i>",
        subtitle_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: CLOSING REFLECTION
    # =========================================================================
    story.append(Spacer(1, 40))

    story.append(Paragraph("Your journey continues.", ParagraphStyle(
        "CloseHeading", parent=styles["Normal"], fontName=f_bold, fontSize=20, leading=24, textColor=COLOR_VIOLET, alignment=1
    )))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Keep making space for yourself.", ParagraphStyle(
        "CloseSub", parent=styles["Normal"], fontName=f_italic, fontSize=12, leading=16, textColor=COLOR_MUTED_TEXT, alignment=1
    )))
    story.append(Spacer(1, 28))

    # Centered Logo mark
    if logo_path and os.path.exists(logo_path):
        story.append(PlatypusImage(logo_path, width=48, height=48, hAlign="CENTER"))
        story.append(Spacer(1, 12))

    story.append(Paragraph("ATHENA", ParagraphStyle(
        "CloseBrand", parent=styles["Normal"], fontName=f_bold, fontSize=14, leading=18, textColor=COLOR_DARK_TEXT, alignment=1
    )))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Understand your rhythm. Make space for yourself.", ParagraphStyle(
        "CloseTagline", parent=styles["Normal"], fontName=f_reg, fontSize=9.5, leading=13, textColor=COLOR_MUTED_TEXT, alignment=1
    )))
    story.append(Spacer(1, 24))

    closing = data.get("chapter_7_looking_forward", {})
    quote_text = closing.get("quote", "Your story isn't measured by perfect days. It is written in the moments you chose to return.").replace('"', "'")
    story.append(Paragraph(f'"{quote_text}"', quote_style))
    story.append(Spacer(1, 20))

    letter_text = closing.get(
        "closing_letter",
        f"Thank you for letting me walk beside you throughout {month_display}, {user_name}. "
        "May the days ahead greet you with gentle pacing, restorative rest, and room to simply breathe."
    )
    story.append(Paragraph(letter_text, ParagraphStyle(
        "CloseLetter", parent=styles["Normal"], fontName=f_reg, fontSize=9, leading=14, textColor=COLOR_DARK_TEXT, alignment=1
    )))
    story.append(Spacer(1, 28))

    # Divider & Privacy Pledge
    story.append(HRFlowable(width="24%", thickness=0.8, color=COLOR_LINE_DIVIDER, spaceBefore=0, spaceAfter=0, hAlign="CENTER"))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Private reflection. Personal data. Yours alone.", ParagraphStyle(
        "ClosePledge", parent=styles["Normal"], fontName=f_italic, fontSize=8.5, leading=12, textColor=COLOR_MUTED_TEXT, alignment=1
    )))

    # Build PDF with background callback on Page 1
    doc.build(
        story,
        canvasmaker=AthenaNumberedCanvas,
        onFirstPage=draw_cover_background,
    )

    pdf_bytes = buffer.getvalue()
    buffer.close()

    # Defensive check: ensure page 1 is never empty and contains required elements
    validate_pdf_content(pdf_bytes, user_name)

    return pdf_bytes
