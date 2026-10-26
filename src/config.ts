export const config = {
    developer: {
        name: "Amr",
        fullName: "Amr Elsherif",
        title: "Network & Cloud Infrastructure Engineer",
        description: "Network & Cloud Infrastructure Engineer (CCNA Track, AWS, Linux) and aspiring DevOps Engineer. Final-year Electronics & Communications Engineering student (ECE '27)."
    },
    social: {
        github: "amrelsherif-eng",
        email: "amrelsherif.eng@gmail.com",
        location: "Alexandria, Egypt"
    },
    about: {
        title: "About Me",
        description: "Final-year Electronics & Communications Engineering student at Damanhour University (GPA 3.47/4.00, Class of 2027), building a career in Network & Cloud Infrastructure on the way to DevOps. CCNA in progress, AWS Academy Cloud Architecting graduate, Linux next. My Flutter team-lead and embedded/IoT work taught me to ship with a team. Open to internships now and full-time roles from July 2027."
    },
    experiences: [
        {
            position: "Network Engineering Trainee (CCNA)",
            company: "NTI · Creativa Hub Damanhour",
            period: "Oct 2026 – Now",
            location: "Damanhour, Egypt",
            description: "120-hour Cisco CCNA v7 Routing & Switching program (90 technical + 30 professional-skills hours) under MCIT's Digital Egypt Youth initiative. Preparing for the CCNA 200-301 exam.",
            responsibilities: [
                "Packet Tracer labs: router and switch configuration, VLANs and inter-VLAN routing, STP, DHCP, static and OSPF routing",
                "IPv4/IPv6 addressing and subnetting, ACLs, NAT, wireless LANs, WAN and VPN/IPsec concepts"
            ],
            technologies: ["Cisco IOS", "Packet Tracer", "OSPF", "VLAN", "STP", "ACL", "NAT"]
        },
        {
            position: "Cloud Architect Intern (AWS)",
            company: "NTI × ITIDA (MCIT)",
            period: "Aug 2026",
            location: "Egypt",
            description: "Fully funded 120-hour internship: 90 hours of AWS training plus 30 hours of soft skills and freelancing. Earned both AWS Academy Graduate badges.",
            responsibilities: [
                "AWS Academy Cloud Foundations (20 h) and Cloud Architecting (60 h)",
                "Labs: VPC networking, EC2, S3, RDS, IAM, load balancing and auto scaling, CloudWatch, decoupled and serverless architectures"
            ],
            technologies: ["AWS", "VPC", "EC2", "S3", "RDS", "IAM", "CloudWatch"]
        },
        {
            position: "Instrumentation & Control Trainee",
            company: "Beheira Drinking Water & Wastewater Co.",
            period: "Jul – Aug 2026",
            location: "Damanhour, Egypt",
            description: "Six-week accredited field training in the Central Workshops instrumentation lab (Holding Company for Water and Wastewater).",
            responsibilities: [
                "Wired, configured and auto-tuned a digital PID temperature controller; installed it in a lab incubator, stable at a 100 °C setpoint",
                "Tested and troubleshot AUMA valve-actuator control boards and distillation-unit heating circuits",
                "Calibration benches, Spec-Cal process calibrator and PCB inspection under ESD safety procedures"
            ],
            technologies: ["PID Control", "Instrumentation", "Calibration", "Troubleshooting"]
        },
        {
            position: "Team Leader",
            company: "DEPI (MCIT) · Harvest Training Center",
            period: "Nov 2025 – Jul 2026",
            location: "Alexandria, Egypt",
            description: "Led the 20-trainee Cross-Platform Mobile group while completing the track; received an MCIT Certificate of Appreciation for the role.",
            responsibilities: [
                "Main point of contact between trainees, instructors and the training center",
                "Coordinated team formation and graduation-project follow-up; led the 5-member team that designed and built DevSync",
                "Organized shared materials and team activities"
            ],
            technologies: ["Team Leadership", "Communication", "Project Coordination"]
        },
        {
            position: "Mobile App Development Trainee (Flutter)",
            company: "DEPI (MCIT)",
            period: "Nov 2025 – Jul 2026",
            location: "Alexandria, Egypt",
            description: "9-month MCIT track in cross-platform mobile development (~120 technical hours) with parallel Business English, soft-skills and freelancing tracks.",
            responsibilities: [
                "Dart and OOP, BLoC and Provider, REST APIs, Firebase (Auth, Firestore, FCM), Git/GitHub workflows",
                "Graduation project: DevSync, an AI-powered developer–project matching app"
            ],
            technologies: ["Flutter", "Dart", "BLoC", "Firebase", "REST APIs", "Git"]
        },
        {
            position: "Electrical Distribution Trainee",
            company: "Beheira Electricity Distribution Co.",
            period: "Summers 2024–25",
            location: "Damanhour, Egypt",
            description: "Accredited field training on medium- and low-voltage distribution networks, transformer substations, load management and safety. Two rounds rated Excellent: 92% (2024) and 98% (2025).",
            responsibilities: [
                "MV/LV distribution networks and transformer substations",
                "Load management and safety compliance"
            ],
            technologies: ["Power Distribution", "Substations", "Safety"]
        },
        {
            position: "Full Stack Web Development Intern (PHP)",
            company: "NTI × ITIDA",
            period: "Jul 2025",
            location: "Egypt",
            description: "Fully funded 120-hour internship (90 technical + 30 freelancing hours), completed with a 97.5% final score.",
            responsibilities: [
                "Team project: PHP and MySQL web app with OOP/MVC structure and session-based authentication",
                "REST API design, database normalization, SQL joins and web security basics"
            ],
            technologies: ["PHP", "MySQL", "MVC", "REST"]
        }
    ],
    projects: [
        {
            id: 1,
            title: "Beam-steered Li-Fi System",
            category: "Networking",
            technologies: "Raspberry Pi 5, PPP, WireGuard, OpenCV",
            image: "/images/projects/lifi.webp",
            description: "4-member graduation project: beam-steered Li-Fi with seamless Wi-Fi failover, using Raspberry Pi 5, PPP, WireGuard and OpenCV tracking. Currently in the design phase.",
            link: ""
        },
        {
            id: 2,
            title: "WeatherLink",
            category: "Embedded",
            technologies: "ESP32-S3, C++, PlatformIO, Blynk Cloud, Flutter, BLoC",
            image: "/images/projects/weatherlink.webp",
            description: "Built as a 5-member team, WeatherLink connects an ESP32-S3 sensor station to Blynk Cloud with a cross-platform Flutter dashboard using Clean Architecture and BLoC.",
            link: "https://github.com/amrelsherif-eng/weatherlink"
        },
        {
            id: 3,
            title: "DevSync",
            category: "Mobile",
            technologies: "Flutter, Firebase, GitHub API, Gemini API, Dart",
            image: "/images/projects/devsync.webp",
            description: "Led the team that designed and built an AI-powered developer–project matching application integrating Firebase services, GitHub API, and Gemini API.",
            link: "https://github.com/amrelsherif-eng/devsync_flutter"
        },
        {
            id: 4,
            title: "ATS LaTeX Resume Template",
            category: "Open Source",
            technologies: "LaTeX, Overleaf, Git, GitHub",
            image: "/images/projects/resume-template.webp",
            description: "Open-source ATS-friendly LaTeX resume template on Overleaf and GitHub, with an AI prompt; the release post reached 12K+ impressions and the tutorial 6.3K.",
            link: "https://github.com/amrelsherif-eng/software-engineer-resume-template"
        },
        {
            id: 5,
            title: "Flutter & Dart Specialization",
            category: "Mobile",
            technologies: "Flutter, Dart, Git",
            image: "/images/placeholder.webp",
            description: "Packt Flutter & Dart Specialization on Coursera: 5 apps and 55 commits of hands-on practice.",
            link: "https://github.com/amrelsherif-eng/Flutter-Dart-Specialization-Packt"
        }
    ],
    contact: {
        email: "amrelsherif.eng@gmail.com",
        github: "https://github.com/amrelsherif-eng",
        linkedin: "https://www.linkedin.com/in/amrelsherif-eng",
        whatsapp: "https://wa.me/201013946047",
        twitter: "",
        facebook: "",
        instagram: ""
    },
    skills: {
        develop: {
            title: "NETWORK & CLOUD",
            description: "Routing, switching & AWS cloud",
            details: "My main track: CCNA in progress (subnetting, OSPF, VLANs and ACLs in Packet Tracer) plus two AWS Academy Graduate badges covering EC2, S3, VPC and IAM. Linux is next.",
            tools: ["Cisco Networking", "OSPF", "VLAN", "Subnetting", "AWS", "EC2", "VPC", "Linux"]
        },
        design: {
            title: "EMBEDDED & ECE",
            description: "Microcontrollers & control systems",
            details: "ESP32 firmware for the WeatherLink team project, a Raspberry Pi 5 Li-Fi graduation project, and industrial training: PID auto-tuning, actuator boards and calibration.",
            tools: ["ESP32", "Raspberry Pi", "Arduino", "C / C++", "IoT", "PID", "Proteus"]
        },
        mobile: {
            title: "MOBILE APPS",
            description: "Flutter apps & team leadership",
            details: "DEPI Flutter track (~120 h): Dart, BLoC, Firebase and REST APIs. Team Leader of a 20-trainee group and of the DevSync project team.",
            tools: ["Flutter", "Dart", "Firebase", "BLoC", "REST APIs", "Git", "Team Leadership"]
        }
    }
};
