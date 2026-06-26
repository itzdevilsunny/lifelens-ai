from database import get_supabase

def seed_data():
    db = get_supabase()

    # 1. Seed default user if none exists
    user_res = db.table("users").select("id").limit(1).execute()
    if not user_res.data:
        db.table("users").insert({
            "name": "Aarav Sharma",
            "age": 32,
            "state": "Maharashtra",
            "occupation": "Small Business Owner",
            "monthly_budget": 30000.0,
        }).execute()
        print("Default user seeded.")

    # 2. Seed real government schemes (idempotent — skip if already present)
    schemes = [
        {
            "title": "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
            "description": "National Mission for Financial Inclusion to ensure access to financial services, namely, basic savings & deposit accounts, remittance, credit, insurance, pension in an affordable manner.",
            "eligibility": "Any Indian citizen above 10 years of age who does not have an existing bank account.",
            "benefit": "Zero-balance savings account, RuPay debit card, Rs. 2 Lakh accidental insurance cover, and overdraft facility up to Rs. 10,000 for eligible account holders.",
            "state": "All"
        },
        {
            "title": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
            "description": "The largest health assurance scheme in the world which aims to provide free health cover up to secondary and tertiary care hospitalization.",
            "eligibility": "Families identified in SECC (Socio-Economic Caste Census) database, mainly low-income, landless, or unorganized sector workers.",
            "benefit": "Health cover of Rs. 5 Lakh per family per year for secondary and tertiary care hospitalization, covering surgery, medicines, diagnostics, and pre-hospitalization costs.",
            "state": "All"
        },
        {
            "title": "Sukanya Samriddhi Yojana (SSY)",
            "description": "A small deposit scheme for girl child launched under 'Beti Bachao Beti Padhao' campaign to secure education and marriage expenses.",
            "eligibility": "Parents or legal guardians of a girl child below the age of 10. Max 2 accounts per family (3 in case of twins).",
            "benefit": "Attractive interest rate (historically 8%+, tax-exempt under Section 80C), maturity after 21 years or upon marriage after age 18.",
            "state": "All"
        },
        {
            "title": "Atal Pension Yojana (APY)",
            "description": "Pension scheme for citizens of India focused on the unorganized sector workers, allowing voluntary contributions.",
            "eligibility": "All Indian citizens aged between 18 and 40 years holding a savings bank account.",
            "benefit": "Guaranteed minimum monthly pension of Rs. 1,000, Rs. 2,000, Rs. 3,000, Rs. 4,000 or Rs. 5,000 after attaining the age of 60 years.",
            "state": "All"
        },
        {
            "title": "Pradhan Mantri Mudra Yojana (PMMY)",
            "description": "Scheme to provide collateral-free loans to micro and small enterprises for business expansion, startup funding, or modernization.",
            "eligibility": "Small business owners, micro-enterprises, shopkeepers, and startups in manufacturing, trading, or service sectors.",
            "benefit": "Collateral-free loans up to Rs. 10 Lakh under three categories: Shishu (up to Rs. 50k), Kishor (Rs. 50k - 5L), and Tarun (Rs. 5L - 10L).",
            "state": "All"
        },
        {
            "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            "description": "Central sector scheme that provides income support to all landholding farmer families across the country.",
            "eligibility": "Farmer families who own cultivable land (subject to exclusion criteria for high-income earners).",
            "benefit": "Direct income support of Rs. 6,000 per year, payable in three equal installments of Rs. 2,000 every four months directly to bank accounts.",
            "state": "All"
        },
        {
            "title": "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
            "description": "Voluntary and contributory pension scheme for unorganized workers to secure their old age.",
            "eligibility": "Unorganized workers (e.g. street vendors, maids, rickshaw pullers) aged 18-40 years with monthly income of Rs. 15,000 or less.",
            "benefit": "Minimum assured monthly pension of Rs. 3,000 after attaining the age of 60 years, with equal matching contribution by Central Government.",
            "state": "All"
        },
        {
            "title": "Ladli Behna Yojana (MP State)",
            "description": "State-specific welfare scheme to enhance economic independence and health of women in Madhya Pradesh.",
            "eligibility": "Women residents of Madhya Pradesh aged 21-60 years, belonging to families with annual income less than Rs. 2.5 Lakh.",
            "benefit": "Monthly direct benefit transfer of Rs. 1,250 directly into the beneficiary's bank account.",
            "state": "Madhya Pradesh"
        },
        {
            "title": "Sanjay Gandhi Niradhar Yojana (Maharashtra)",
            "description": "State-specific financial support scheme for destitute persons, disabled individuals, widows, and people suffering from major illnesses.",
            "eligibility": "Destitute, elderly (above 65), disabled persons (40%+ disability) who are residents of Maharashtra with annual family income below Rs. 21,000.",
            "benefit": "Monthly financial assistance of Rs. 1,000 for single persons, and Rs. 1,200 for families with two or more beneficiaries.",
            "state": "Maharashtra"
        }
    ]

    # Check which schemes already exist and only insert new ones
    existing_res = db.table("government_schemes").select("title").execute()
    existing_titles = {row["title"] for row in (existing_res.data or [])}

    new_schemes = [s for s in schemes if s["title"] not in existing_titles]
    if new_schemes:
        db.table("government_schemes").insert(new_schemes).execute()
        print(f"Seeded {len(new_schemes)} new government scheme(s).")
    else:
        print("Government schemes already seeded — skipping.")


if __name__ == "__main__":
    seed_data()
