import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_DIR = 'C:/Users/srikr/.gemini/antigravity/brain/e7bc2afb-5492-4094-b2f9-7db116f49291/scratch/docx_extracted/word/media';

// Read media assets
const snistLogo = fs.readFileSync(path.join(MEDIA_DIR, '71bc68c3140dffbe54e2b9b1ad04e48e6a34ea28.jpg'));
const certFundamentals = fs.readFileSync(path.join(MEDIA_DIR, '3cea4db85d6baca8373f7c1857022093102ff918.jpg'));
const certNetwork = fs.readFileSync(path.join(MEDIA_DIR, 'f8b824c4f3a5be3479cd63c5bddbb1b3a0afb904.jpg'));
const certCloud = fs.readFileSync(path.join(MEDIA_DIR, 'cc61747e91fce42b3495db0fa9dd220aec926a8c.jpg'));
const certSecOps = fs.readFileSync(path.join(MEDIA_DIR, 'd192153b13702d1c29b6c6e60ed081a0e38d6f9f.jpg'));
const certAI = fs.readFileSync(path.join(MEDIA_DIR, '9104d8a0d7a0d329168f7adfdca55679394e0aff.jpg'));
const certFinal = fs.readFileSync(path.join(MEDIA_DIR, '555fdea3a1ec9355beb89a97f7e10984d1c5789b.jpg'));

function p(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text.map(t => (typeof t === 'string' ? new TextRun({ text: t, font: 'Times New Roman', size: 24, ...opts }) : t))
    : [new TextRun({ text, font: 'Times New Roman', size: opts.size || 24, bold: opts.bold || false, italics: opts.italics || false, color: opts.color })];

  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before || 120, after: opts.after || 120, line: opts.line || 276 },
    children: runs
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 32, bold: true, color: '002060' })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 28, bold: true, color: '1F497D' })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, font: 'Times New Roman', size: 26, bold: true, color: '365F91' })]
  });
}

function bullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', font: 'Times New Roman', size: 24, bold: true }));
  }
  children.push(new TextRun({ text, font: 'Times New Roman', size: 24 }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 80, after: 80, line: 260 },
    children
  });
}

const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 6,
  color: 'A6B9D0'
};

const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder
};

function makeTable(headers, rows, colWidths = []) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: colWidths[i] ? { size: colWidths[i], type: WidthType.DXA } : undefined,
      borders: cellBorders,
      shading: { fill: '002060' },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: h, font: 'Times New Roman', size: 22, bold: true, color: 'FFFFFF' })]
        })
      ]
    }))
  });

  const bodyRows = rows.map((r, rIdx) => new TableRow({
    children: r.map((cellText, i) => new TableCell({
      width: colWidths[i] ? { size: colWidths[i], type: WidthType.DXA } : undefined,
      borders: cellBorders,
      shading: { fill: rIdx % 2 === 1 ? 'F2F5F9' : 'FFFFFF' },
      children: [
        new Paragraph({
          alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ text: String(cellText), font: 'Times New Roman', size: 22 })]
        })
      ]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows]
  });
}

const docChildren = [];

// ============================================================================
// PAGE 1: TITLE PAGE
// ============================================================================
docChildren.push(
  p('A Summer Industry Internship – I Report', { align: AlignmentType.CENTER, bold: true, size: 28, before: 100, after: 80 }),
  p('on', { align: AlignmentType.CENTER, size: 24, before: 60, after: 60 }),
  p('CYBERSECURITY VIRTUAL INTERNSHIP', { align: AlignmentType.CENTER, bold: true, size: 36, color: 'C00000', before: 80, after: 60 }),
  p('(Palo Alto Networks – AICTE EduSkills Program)', { align: AlignmentType.CENTER, bold: true, size: 24, color: '002060', before: 40, after: 120 }),
  p('During', { align: AlignmentType.CENTER, size: 24, before: 60, after: 40 }),
  p('II Year II Semester Summer', { align: AlignmentType.CENTER, bold: true, size: 26, before: 40, after: 140 }),
  p('Submitted to', { align: AlignmentType.CENTER, size: 24, before: 80, after: 40 }),
  p('The Department of Computer Science and Engineering (Cyber Security)', { align: AlignmentType.CENTER, bold: true, size: 26, color: '1F497D', before: 40, after: 60 }),
  p('In partial fulfillment of the academic requirements of', { align: AlignmentType.CENTER, size: 24, before: 40, after: 40 }),
  p('Jawaharlal Nehru Technological University', { align: AlignmentType.CENTER, bold: true, size: 26, before: 40, after: 40 }),
  p('for', { align: AlignmentType.CENTER, size: 24, before: 40, after: 40 }),
  p('The award of the degree of', { align: AlignmentType.CENTER, size: 24, before: 40, after: 40 }),
  p('Bachelor of Technology', { align: AlignmentType.CENTER, bold: true, size: 30, before: 60, after: 40 }),
  p('in', { align: AlignmentType.CENTER, size: 24, before: 40, after: 40 }),
  p('Computer Science and Engineering (Cyber Security)', { align: AlignmentType.CENTER, bold: true, size: 28, color: '002060', before: 40, after: 140 }),
  p('By', { align: AlignmentType.CENTER, bold: true, size: 24, before: 80, after: 40 }),
  p('Srikrishna Eitta   –   25315A6201', { align: AlignmentType.CENTER, bold: true, size: 28, color: '002060', before: 40, after: 120 }),
  p('Internal Guide / Internship Coordinator:', { align: AlignmentType.CENTER, bold: true, size: 22, before: 80, after: 30 }),
  p('Ponnam Rajesh', { align: AlignmentType.CENTER, bold: true, size: 26, before: 30, after: 20 }),
  p('Assistant Professor', { align: AlignmentType.CENTER, size: 24, before: 20, after: 80 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
    children: [new ImageRun({ data: snistLogo, transformation: { width: 140, height: 75 } })]
  }),
  p('Sreenidhi Institute of Science and Technology', { align: AlignmentType.CENTER, bold: true, size: 30, color: '002060', before: 60, after: 30 }),
  p('Yamnampet, Ghatkesar, R.R. District, Hyderabad – 501301', { align: AlignmentType.CENTER, size: 22, before: 20, after: 60 }),
  p('Affiliated to', { align: AlignmentType.CENTER, size: 22, before: 30, after: 20 }),
  p('Jawaharlal Nehru Technological University', { align: AlignmentType.CENTER, bold: true, size: 24, before: 20, after: 20 }),
  p('Hyderabad – 500085', { align: AlignmentType.CENTER, size: 22, before: 20, after: 40 }),
  p('Department of Computer Science and Engineering (Cyber Security)', { align: AlignmentType.CENTER, bold: true, size: 24, color: '1F497D', before: 40, after: 100 }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// PAGE 2: CERTIFICATE
// ============================================================================
docChildren.push(
  p('Sreenidhi Institute of Science and Technology', { align: AlignmentType.CENTER, bold: true, size: 30, color: '002060', before: 100, after: 40 }),
  p('Department of Computer Science and Engineering (Cyber Security)', { align: AlignmentType.CENTER, bold: true, size: 24, color: '1F497D', before: 40, after: 100 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 80 },
    children: [new ImageRun({ data: snistLogo, transformation: { width: 130, height: 70 } })]
  }),
  p('CERTIFICATE', { align: AlignmentType.CENTER, bold: true, size: 34, color: '002060', before: 100, after: 240 }),
  p(
    'This is to certify that this Summer Industry Internship – I Report on “Cybersecurity Virtual Internship (Palo Alto Networks)”, submitted by Srikrishna Eitta (25315A6201), in the year 2026 in partial fulfillment of the academic requirements of Jawaharlal Nehru Technological University for the award of the degree of Bachelor of Technology in Computer Science and Engineering (Cyber Security), is a bonafide work in industry internship that has been carried out during II B.Tech CSE (Cyber Security) II Semester Summer, will be evaluated in III B.Tech CSE (Cyber Security) I Semester, under our guidance. This report has not been submitted to any other institute or university for the award of any degree.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 120, after: 360, line: 360 }
  ),
  new Paragraph({ spacing: { before: 300, after: 200 } }),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              p('Internship Coordinator', { bold: true, size: 24, before: 0, after: 40 }),
              p('Ponnam Rajesh', { bold: true, size: 24, before: 0, after: 20 }),
              p('Assistant Professor', { size: 22, before: 0, after: 20 }),
              p('Department of CSE (Cyber Security)', { size: 22, before: 0, after: 20 })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              p('Dr. V. Sowmya Devi', { align: AlignmentType.RIGHT, bold: true, size: 24, before: 0, after: 20 }),
              p('Head, Department of CSE (Cyber Security)', { align: AlignmentType.RIGHT, bold: true, size: 24, before: 0, after: 20 }),
              p('Sreenidhi Institute of Science and Technology', { align: AlignmentType.RIGHT, size: 22, before: 0, after: 20 })
            ]
          })
        ]
      })
    ]
  }),
  new Paragraph({ spacing: { before: 400, after: 100 } }),
  p('External Examiner', { bold: true, size: 24, before: 200, after: 40 }),
  p('Date:- _______________________', { size: 24, before: 40, after: 100 }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// PAGE 3: CERTIFICATES OF INTERNSHIP
// ============================================================================
docChildren.push(
  p('CERTIFICATES OF INTERNSHIP', { align: AlignmentType.CENTER, bold: true, size: 30, color: '002060', before: 100, after: 120 }),
  p('National Internship Portal & EduSkills – Palo Alto Networks Certification', { align: AlignmentType.CENTER, size: 24, italics: true, before: 40, after: 160 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 160 },
    children: [new ImageRun({ data: certFinal, transformation: { width: 500, height: 700 } })]
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// PAGE 4: DECLARATION
// ============================================================================
docChildren.push(
  p('DECLARATION', { align: AlignmentType.CENTER, bold: true, size: 32, color: '002060', before: 140, after: 260 }),
  p(
    'I, Srikrishna Eitta (25315A6201), student of SREENIDHI INSTITUTE OF SCIENCE AND TECHNOLOGY, YAMNAMPET, GHATKESAR, studying III year I semester, COMPUTER SCIENCE AND ENGINEERING (CYBER SECURITY) solemnly declare that the Summer Industry Internship-I Report, titled “Cybersecurity Virtual Internship (Palo Alto Networks)” is submitted to SREENIDHI INSTITUTE OF SCIENCE AND TECHNOLOGY for partial fulfillment for the award of degree of Bachelor of Technology in COMPUTER SCIENCE AND ENGINEERING (CYBER SECURITY).',
    { align: AlignmentType.JUSTIFY, size: 24, before: 140, after: 180, line: 360 }
  ),
  p(
    'It is declared to the best of our knowledge that the work reported does not form part of any dissertation submitted to any other University or Institute for award of any degree.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 140, after: 400, line: 360 }
  ),
  new Paragraph({ spacing: { before: 300, after: 100 } }),
  p('Srikrishna Eitta   –   25315A6201', { align: AlignmentType.RIGHT, bold: true, size: 26, color: '002060', before: 200, after: 100 }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// PAGE 5: ACKNOWLEDGEMENT
// ============================================================================
docChildren.push(
  p('ACKNOWLEDGEMENT', { align: AlignmentType.CENTER, bold: true, size: 32, color: '002060', before: 140, after: 240 }),
  p(
    'I would like to express my gratitude to all the people behind the screen who helped me to transform cybersecurity principles into practical defense capabilities and real enterprise applications.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 120, line: 340 }
  ),
  p(
    'I would like to thank my Internship coordinator Ponnam Rajesh, Assistant Professor, Department of CSE (Cyber Security), for his technical guidance, constant encouragement and support in carrying out my project and internship work at college.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 120, line: 340 }
  ),
  p(
    'I profoundly thank Dr. V. Sowmya Devi, Head of the Department of Computer Science and Engineering (Cyber Security), who has been an excellent guide and also a great source of inspiration to my work.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 120, line: 340 }
  ),
  p(
    'I am also grateful to AICTE, the Ministry of Education, EduSkills Foundation, and Palo Alto Networks for designing and offering this industry-relevant virtual internship program under the National Internship Portal, equipping students with state-of-the-art enterprise security skills.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 120, line: 340 }
  ),
  p(
    'I would like to express my heart-felt gratitude to my parents without whom I would not have been privileged to achieve and fulfill my dreams. I am grateful to our principal, Dr. T. Ch. Siva Reddy, who most ably runs the institution and has had the major hand in enabling me to complete my internship project.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 120, line: 340 }
  ),
  p(
    'The satisfaction and euphoria that accompany the successful completion of the task would be great but incomplete without the mention of the people who made it possible with their constant guidance and encouragement crowns all the efforts with success. In this context, I would like thank all the other staff members, both teaching and non-teaching, who have extended their timely help and eased my task.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 360, line: 340 }
  ),
  p('Srikrishna Eitta   –   25315A6201', { align: AlignmentType.RIGHT, bold: true, size: 26, color: '002060', before: 200, after: 100 }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// PAGE 6: ABSTRACT
// ============================================================================
docChildren.push(
  p('CYBERSECURITY VIRTUAL INTERNSHIP', { align: AlignmentType.CENTER, bold: true, size: 28, color: '002060', before: 100, after: 40 }),
  p('(PALO ALTO NETWORKS – AICTE EDUSKILLS PROGRAM)', { align: AlignmentType.CENTER, bold: true, size: 22, color: 'C00000', before: 20, after: 160 }),
  p('Abstract', { align: AlignmentType.CENTER, bold: true, size: 30, before: 60, after: 180 }),
  p(
    'The 8-week Cybersecurity Virtual Internship, conducted under the AICTE – EduSkills Virtual Internship Program in technical partnership with Palo Alto Networks, provides a comprehensive, industry-grounded immersion into modern cyber defense architectures. The curriculum is systematically structured into five progressive knowledge tracks: Cybersecurity Fundamentals, Network Security Fundamentals, Cloud Security Fundamentals, Security Operations Fundamentals, and AI in Cybersecurity Fundamentals. Spanning June to August 2026, the program bridged theoretical academic concepts with production enterprise practices, encompassing advanced threat lifecycles, next-generation firewall (NGFW) policies, container security, cloud-native defense, Security Operations Center (SOC) workflows, and AI-driven detection engineering.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 120, line: 340 }
  ),
  p(
    'Key competencies developed include deep packet inspection using Wireshark, Docker container network isolation and vulnerability scanning, configuration of Palo Alto Next-Generation Firewall security zones (App-ID, User-ID, and WildFire cloud sandboxing), and extended detection and response using Cortex XDR and Cortex XSIAM platforms. By examining the dual role of artificial intelligence—countering sophisticated AI-synthesized threats with Palo Alto Networks Precision AI framework—the internship established a rigorous defense-in-depth security mindset. Continuous evaluations through weekly assessments, project documentation, and a cumulative final assessment resulted in the successful completion of all tracks with an Outstanding (Grade O) certification.',
    { align: AlignmentType.JUSTIFY, size: 24, before: 100, after: 160, line: 340 }
  ),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// PAGE 7: INDEX
// ============================================================================
docChildren.push(
  p('INDEX', { align: AlignmentType.CENTER, bold: true, size: 32, color: '002060', before: 120, after: 200 }),
  makeTable(
    ['Section / Topic', 'Page No.'],
    [
      ['Abstract', 'i'],
      ['1. INTRODUCTION', '11 - 13'],
      ['   1.1 About the Internship', '11'],
      ['   1.2 Plan of Training Program', '11'],
      ['   1.3 Scope', '12'],
      ['   1.4 Existing System', '12'],
      ['   1.5 Proposed System', '13'],
      ['2. SYSTEM ANALYSIS', '14 - 16'],
      ['   2.1 Functional Requirement Specifications', '14'],
      ['   2.2 Performance Requirements', '15'],
      ['   2.3 Software Requirements', '15'],
      ['   2.4 Hardware Requirements', '16'],
      ['3. SYSTEM DESIGN', '17 - 22'],
      ['   3.1 Architecture Design', '17'],
      ['   3.2 Modules', '18'],
      ['   3.3 UML Diagrams', '19'],
      ['       3.3.1 Use Case Diagrams', '19'],
      ['       3.3.2 Class Diagrams', '20'],
      ['       3.3.3 Sequence Diagrams', '21'],
      ['       3.3.4 Activity Diagrams', '22'],
      ['4. SYSTEM IMPLEMENTATION', '23 - 27'],
      ['   4.1 Implementation Steps', '23'],
      ['   4.2 Operational Procedure', '25'],
      ['5. OUTPUT SCREENS / LAB WORK', '28 - 31'],
      ['6. INTERNSHIP FEEDBACK (Experience)', '32 - 33'],
      ['   6.1 About Company', '32'],
      ['   6.2 Experience in Internship', '32'],
      ['   6.3 Challenges Faced', '33'],
      ['7. CONCLUSIONS AND FUTURE SCOPE', '34'],
      ['BIBLIOGRAPHY', '35'],
      ['Appendix-A: Security Technologies & Modern Defense Architecture', '36'],
      ['Appendix-B: Unified Modeling Language (UML) in Cybersecurity', '37'],
      ['Appendix C: Abstract', '38'],
      ['Appendix D: Correlation between Internship-I and POs / PSOs', '39 - 40'],
      ['Appendix E: Domain of Internship and Nature of Internship', '41']
    ],
    [7500, 2000]
  ),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// CHAPTER 1: INTRODUCTION
// ============================================================================
docChildren.push(
  h1('1. INTRODUCTION'),
  h2('1.1 About the Internship'),
  p(
    'The Summer Industry Internship – I was undertaken through the AICTE – EduSkills Virtual Internship Program, delivered on the National Internship Portal under the guidance of the Ministry of Education, Government of India, in technical collaboration with Palo Alto Networks. Carrying Reference No. C17Y2026M071486876 and Student ID STU6a0ab943765381779087683, the 8-week virtual internship provided an intensive, industry-aligned pathway to master cutting-edge cybersecurity principles.',
    { align: AlignmentType.JUSTIFY }
  ),
  p(
    'The core objective of the internship was to bridge academic computer science fundamentals with production-grade enterprise cybersecurity infrastructure. Throughout the program, complex theoretical topics were reinforced with practical laboratory exercises, deep packet inspection, firewall configuration, container scanning, and threat intelligence correlation, culminating in a Grade of O (Outstanding).',
    { align: AlignmentType.JUSTIFY }
  ),

  h2('1.2 Plan of Training Program'),
  p('The 8-week curriculum was systematically organized into five progressive tracks, as outlined below:'),
  bullet('Introduction to cyberthreat landscapes, malware classification, social engineering, DDoS mechanics, attack lifecycles, and Zero Trust security philosophy.', 'Week 1–2: Cybersecurity Fundamentals:'),
  bullet('OSI and TCP/IP protocol stack analysis, IP addressing schemes, packet encapsulation, Wireshark traffic baselining, and Next-Generation Firewall (NGFW) security zone policies with App-ID and User-ID.', 'Week 3–4: Network Security Fundamentals:'),
  bullet('Shared responsibility model, virtualization vs. containerization, Docker bridge networking, container image vulnerability scanning, and cloud-native security across the 4 C\'s (Cloud, Clusters, Containers, Code).', 'Week 5: Cloud Security Fundamentals:'),
  bullet('Security Operations Center (SOC) maturity pillars, infrastructure automation, DevSecOps CI/CD pipelines, endpoint detection & response (Cortex XDR), and threat intelligence lifecycles.', 'Week 6–7: Security Operations Fundamentals:'),
  bullet('SOAR automated playbooks, Palo Alto Networks Precision AI architecture, Cortex XSIAM unified SIEM/SOAR/XDR data model, and final cumulative examination.', 'Week 8: Elements of Security Operations & AI:'),

  h2('1.3 Scope'),
  p(
    'The scope of the internship encompasses developing a comprehensive, multi-tiered enterprise defense strategy. Key focus areas include network perimeter defense using next-generation firewalls, secure remote and branch access through Secure Access Service Edge (SASE) and Zero Trust Network Access (ZTNA 2.0), cloud workload protection, container vulnerability mitigation, and automated threat hunting using machine learning and artificial intelligence.',
    { align: AlignmentType.JUSTIFY }
  ),

  h2('1.4 Existing System'),
  p(
    'In traditional enterprise environments, cybersecurity relies predominantly on legacy perimeter-centric defense models and isolated point solutions. Organizations deploy conventional stateful packet inspection firewalls that filter traffic strictly by IP addresses and port numbers (e.g., port 80 for HTTP or 443 for HTTPS). However, modern adversaries routinely tunnel malicious payloads, command-and-control (C2) beacons, and exfiltration traffic through legitimate standard ports, rendering port-based filtering ineffective.',
    { align: AlignmentType.JUSTIFY }
  ),
  p('The limitations of existing legacy security systems include:'),
  bullet('Traditional firewalls cannot inspect application payloads or verify user identity, allowing malware to hide inside trusted protocols.', 'Lack of Application & User Visibility:'),
  bullet('Point solutions (standalone antivirus, firewalls, and proxy tools) operate in isolation without sharing telemetry, creating critical visibility blind spots.', 'Siloed Security Controls:'),
  bullet('SOC analysts are inundated with tens of thousands of alerts daily, resulting in severe alert fatigue, delayed breach detection, and high dwell times.', 'Manual Incident Triage:'),
  bullet('Traditional firewalls cannot inspect microservices, inter-container communications, or dynamic ephemeral cloud workloads.', 'Zero Cloud-Native Protection:'),
  bullet('Legacy systems rely on static hash signatures that fail against polymorphic malware, zero-day vulnerabilities, and fileless memory exploits.', 'Static Signature Obsolescence:'),

  h2('1.5 Proposed System'),
  p(
    'The proposed security architecture, introduced through the Palo Alto Networks ecosystem, implements an integrated, multi-tier Zero Trust and AI-driven defense posture. Rather than trusting internal traffic blindly, the proposed model enforces strict verification for every access request, user identity, and application payload regardless of physical network location.',
    { align: AlignmentType.JUSTIFY }
  ),
  p('Core pillars of the proposed enterprise architecture include:'),
  bullet('Classifies all network traffic dynamically regardless of port, protocol, SSL/TLS encryption, or evasive technique, enabling precise granular access control.', 'App-ID & User-ID Next-Generation Inspection:'),
  bullet('Cloud-based automated sandboxing environment that executes unknown suspicious files and links within isolated environments, generating global protections in under seconds.', 'WildFire Cloud Threat Analysis:'),
  bullet('Converges software-defined wide area networking (SD-WAN) and comprehensive cloud security services into a single cloud-delivered fabric protecting hybrid workforces.', 'Prisma Access SASE & ZTNA 2.0:'),
  bullet('Integrates endpoint protection, network forensics, and cloud data into a unified timeline, automatically suppressing false alarms and tracing root causes.', 'Cortex XDR & Cortex XSIAM:'),
  bullet('Combines machine learning, deep learning, and generative AI to detect and neutralize adversarial attacks in real-time, executing automated SOAR containment playbooks.', 'Precision AI Automation:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// CHAPTER 2: SYSTEM ANALYSIS
// ============================================================================
docChildren.push(
  h1('2. SYSTEM ANALYSIS'),
  h2('2.1 Functional Requirement Specifications'),
  p('The functional requirements define the specific operational capabilities and security behaviors that the system must deliver:'),
  bullet('The system shall continuously ingest threat intelligence from global telemetry feeds, domain reputation registries, and malicious IP catalogs.', 'Threat Intelligence Ingestion:'),
  bullet('The system shall perform full payload inspection across OSI layers 2 through 7, identifying applications, protocols, and hidden evasion tunnels.', 'Deep Packet Inspection (DPI):'),
  bullet('The system shall support bidirectional SSL/TLS decryption for inbound and outbound sessions to expose concealed malware and credential theft.', 'Decryption & SSL Forward Proxy:'),
  bullet('The system shall extract unknown files, executables, and scripts in transit and submit them to sandbox environments for behavioral execution and detonation.', 'Dynamic Sandbox Analysis:'),
  bullet('The platform shall ingest host, network, and cloud telemetry, run behavioral anomaly detection models, and correlate isolated alerts into unified incident graphs.', 'Cross-Data Source Correlation:'),
  bullet('Upon detection of a high-confidence threat, the system shall trigger pre-configured playbooks to isolate endpoints, block malicious IPs, and revoke compromised tokens.', 'Automated SOAR Orchestration:'),
  bullet('The platform shall provide interactive analyst consoles displaying incident severity, kill-chain progression, affected assets, and recommended remediations.', 'Security Telemetry Dashboard:'),

  h2('2.2 Performance Requirements'),
  p('To safeguard enterprise operations without degrading network bandwidth or user productivity, the architecture conforms to strict performance criteria:'),
  bullet('Packet inspection and policy matching latency shall not exceed 1.5 to 2.0 milliseconds per packet under peak network load.', 'Inspection Latency:'),
  bullet('The security gateway shall support line-rate deep packet inspection exceeding 10 Gbps without packet dropping or session degradation.', 'Throughput & Capacity:'),
  bullet('The core security management and threat intelligence infrastructure shall deliver 99.999% carrier-grade availability, with automatic failover.', 'Availability & Reliability:'),
  bullet('The analytics backend shall scale horizontally to support over 100,000 active concurrent endpoints and billions of daily log events.', 'Scalability:'),
  bullet('Machine learning classifiers shall maintain false positive rates below 0.1% to prevent disruption to legitimate business communication.', 'Precision & Accuracy:'),

  h2('2.3 Software Requirements'),
  bullet('Ubuntu Linux 22.04 LTS / Windows 11 Enterprise (64-bit).', 'Operating Systems:'),
  bullet('Wireshark 4.2+ for deep packet inspection, PCAP capture analysis, and protocol dissection.', 'Network Analysis Tools:'),
  bullet('Docker Engine 24.x with Docker Compose for microservice isolation and vulnerability auditing.', 'Containerization Platform:'),
  bullet('Palo Alto Networks PAN-OS 11.x virtual appliance (PA-VM).', 'Firewall Operating System:'),
  bullet('Cortex XDR, Cortex XSIAM, and Palo Alto Networks WildFire cloud sandbox portal.', 'Security Operations & SIEM:'),
  bullet('Prisma Access cloud tenant for Zero Trust Network Access evaluation.', 'Cloud Security Platform:'),
  bullet('Visual Studio Code, Git, and Python 3.11 for automation scripting.', 'Development Tools:'),

  h2('2.4 Hardware Requirements'),
  bullet('Intel Core i7 / Xeon (10th Generation+) or AMD Ryzen 7 / EPYC multi-core processor (minimum 8 physical cores).', 'Processor:'),
  bullet('16 GB RAM minimum; 32 GB RAM recommended for hosting concurrent virtual appliances and container networks.', 'System Memory:'),
  bullet('512 GB Solid State Drive (NVMe SSD) providing high I/O throughput for packet dumps and telemetry logging.', 'Storage:'),
  bullet('Gigabit Ethernet Controller (1000BASE-T) with promiscuous mode support for packet capture.', 'Network Interface:'),
  bullet('Dual monitor configuration with 1920x1080 resolution for concurrent monitoring of packet streams, logs, and consoles.', 'Display:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// CHAPTER 3: SYSTEM DESIGN
// ============================================================================
docChildren.push(
  h1('3. SYSTEM DESIGN'),
  h2('3.1 Architecture Design'),
  p(
    'The enterprise security framework follows a modernized Three-Tier Defense-in-Depth Architecture, decoupling network enforcement, cloud analytical processing, and centralized operations management.',
    { align: AlignmentType.JUSTIFY }
  ),
  bullet('Enforces perimeter and micro-perimeter boundaries using Next-Generation Firewalls (NGFW) and SASE gateways. Inspects traffic at line rate, enforces App-ID and User-ID controls, and isolates suspicious sessions.', '1. Enforcement & Edge Tier (Sensor Layer):'),
  bullet('Hosts the cloud sandboxing cluster (WildFire), threat intelligence repositories, and machine learning behavioral scoring engines. Detonates zero-day payloads and distributes prevention signatures globally within seconds.', '2. Analytical & Inspection Engine Tier (Intelligence Layer):'),
  bullet('Unifies SIEM, SOAR, and XDR capabilities within Cortex XSIAM. Ingests normalized logs, executes automated remediation playbooks, and empowers SOC analysts through unified incident timelines.', '3. Operations & Orchestration Tier (Management Layer):'),

  h2('3.2 Modules'),
  bullet('Focuses on threat categorization, mapping the 7-stage Cyber-Attack Lifecycle, evaluating Zero Trust architectural principles, and foundational defense strategies.', 'Module 1: Cybersecurity Fundamentals:'),
  bullet('Covers IP addressing, OSI/TCP-IP layering, packet encapsulation dissection via Wireshark, NGFW security zone configuration, and granular App-ID/User-ID traffic policy creation.', 'Module 2: Network Security Fundamentals:'),
  bullet('Examines shared responsibility matrices, virtual machine vs. container security models, Docker bridge network deployment, container image scanning, and DevSecOps pipeline controls.', 'Module 3: Cloud Security Fundamentals:'),
  bullet('Explores the 6 pillars of modern SOC maturity, security orchestration, automation, and response (SOAR), endpoint containment using Cortex XDR, and threat intelligence sharing.', 'Module 4: Security Operations Fundamentals:'),
  bullet('Analyzes Palo Alto Networks Precision AI framework, AI-first Security Operations with Cortex XSIAM, and defending enterprise systems against adversarial AI threats.', 'Module 5: AI in Cybersecurity Fundamentals:'),

  h2('3.3 UML Diagrams'),
  h3('3.3.1 Use Case Diagram'),
  p('The Use Case Diagram defines the interactions between primary system actors and core security capabilities:'),
  bullet('Submits network traffic, authenticates identity via MFA, and accesses authorized enterprise services.', 'Actor 1: End User:'),
  bullet('Monitors correlated incident graphs, investigates triage findings, and authorizes advanced response actions.', 'Actor 2: SOC Analyst:'),
  bullet('Configures security zone policies, manages credentials, updates firewall rules, and provisions container images.', 'Actor 3: Security Administrator:'),
  bullet('Continuously parses live telemetry, executes machine learning anomaly detection, and triggers automated quarantine playbooks.', 'Actor 4: Precision AI & SOAR Engine:'),
  bullet('Attempts unauthorized access, port scanning, malware delivery, credential theft, and command-and-control beaconing.', 'Actor 5: Adversary / Threat Actor:'),

  h3('3.3.2 Class Diagram'),
  p('The static structure of the security platform is modeled through interconnected object classes:'),
  bullet('Attributes: zoneId, zoneName, securityLevel, interfaces[]. Methods: assignInterface(), applyPolicy().', 'Class SecurityZone:'),
  bullet('Attributes: packetId, srcIp, destIp, srcPort, destPort, protocol, payloadBytes, timestamp. Methods: getHeader(), parseProtocol(), computeHash().', 'Class NetworkPacket:'),
  bullet('Attributes: ruleId, ruleName, sourceZones[], destZones[], applications[], action (ALLOW/DENY/DROP), logSetting. Methods: evaluatePacket(), matchRule().', 'Class FirewallRule:'),
  bullet('Attributes: indicatorId, iocType (IP/Hash/Domain), threatCategory, severityScore, confidence. Methods: queryIntelligence(), updateReputation().', 'Class ThreatIndicator:'),
  bullet('Attributes: incidentId, title, severity, killChainStage, relatedAssets[], rootCauseAnalysis, status. Methods: assignAnalyst(), escalate(), resolve().', 'Class IncidentTicket:'),
  bullet('Attributes: playbookId, triggerEvent, actionsList[], isAutomated. Methods: executeAction(), isolateHost(), notifyAdmin().', 'Class SOARPlaybook:'),

  h3('3.3.3 Sequence Diagram'),
  p('The Sequence Diagram depicts the chronological communication flow during an attempted intrusion:'),
  bullet('1. User initiates web session -> Packet reaches Next-Generation Firewall.', 'Sequence Flow:'),
  bullet('2. NGFW validates IP/Port -> Decrypts SSL payload -> Extracts App-ID and User-ID metadata.', ''),
  bullet('3. NGFW checks local signature cache -> File payload is unclassified -> Transmits hash to WildFire Cloud.', ''),
  bullet('4. WildFire Cloud executes payload in virtual sandbox -> Detects malicious behavior -> Returns Threat Verdict.', ''),
  bullet('5. NGFW terminates connection -> Sends security event log to Cortex XSIAM.', ''),
  bullet('6. Cortex XSIAM triggers SOAR Playbook -> Cortex XDR agent isolates host endpoint -> Alerts SOC team.', ''),

  h3('3.3.4 Activity Diagram'),
  p('The Activity Diagram illustrates the operational logic executed upon packet arrival:'),
  bullet('Start -> Intercept Ingress Packet -> Parse Headers -> Evaluate Security Zone Rules.', 'Step 1: Ingress Evaluation:'),
  bullet('Does packet match permitted rule? If No -> Drop packet & Log drop event -> Terminate.', 'Step 2: Rule Enforcement:'),
  bullet('If Yes -> Perform Deep Packet Inspection -> Reassemble application stream -> Extract Payload.', 'Step 3: Deep Inspection:'),
  bullet('Is payload recognized as known malicious? If Yes -> Block traffic -> Alert SOC -> Terminate.', 'Step 4: Signature Matching:'),
  bullet('If Unknown -> Dispatch file copy to WildFire Sandbox -> Execute heuristics & ML analysis.', 'Step 5: Cloud Sandboxing:'),
  bullet('Did sandbox confirm malicious payload? If Yes -> Block IP & Quarantine Endpoint -> End. If No -> Permit transmission -> End.', 'Step 6: Final Disposition:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// CHAPTER 4: SYSTEM IMPLEMENTATION
// ============================================================================
docChildren.push(
  h1('4. SYSTEM IMPLEMENTATION'),
  h2('4.1 Implementation Steps'),
  p('The practical laboratory work was executed through five structured phases:'),
  bullet('Configured an isolated virtual testbed utilizing virtual machines and bridge networks. Established segmented network zones simulating Untrusted External (WAN), Demilitarized Zone (DMZ), and Trusted Internal (LAN) environments.', 'Step 1: Virtual Lab & Network Topology Setup:'),
  bullet('Deployed Wireshark protocol analyzer on network tapping interfaces. Captured live DNS, HTTP, TCP three-way handshakes, and ARP traffic. Filtered packet streams to identify malformed packet headers, SYN floods, and cleartext credential transmissions.', 'Step 2: Packet Capture & Protocol Analysis with Wireshark:'),
  bullet('Created Docker bridge networks. Deployed sample containerized microservices and subjected container images to vulnerability auditing. Analyzed CVE severity reports and implemented Dockerfile hardening practices to mitigate root privilege escalation.', 'Step 3: Container Security Isolation & Docker Vulnerability Auditing:'),
  bullet('Configured Next-Generation Firewall security policies within PAN-OS. Defined explicit security zones (Inside, Outside, DMZ). Implemented App-ID rules to permit web browsing while restricting unauthorized file-sharing applications regardless of port numbers.', 'Step 4: NGFW Security Zone & Rule Policy Configuration:'),
  bullet('Simulated attack alerts across endpoints and network sensors. Utilized Cortex XDR to trace the attack causality chain from initial execution to memory injection. Deployed automated playbooks to quarantine test hosts.', 'Step 5: Incident Investigation & AI Triage in Cortex XSIAM:'),

  h2('4.2 Operational Procedure'),
  p('The implemented security system operates via an end-to-end continuous validation cycle:'),
  bullet('Every inbound user connection is subjected to strict identity verification via multi-factor authentication (MFA) and conditional device posture checks before granting network admission.', '1. Identity Authentication & Session Admission:'),
  bullet('All ingress and egress packets undergo continuous deep packet inspection. Protocol decoders identify evasive techniques, protocol anomalies, and malicious command-and-control beacons.', '2. Ingress & Egress Deep Packet Inspection:'),
  bullet('Unclassified executables, PDFs, and scripts are immediately submitted to the cloud-delivered WildFire engine, detonating zero-day files in parallel virtual sandbox environments.', '3. Automated Threat Sandboxing:'),
  bullet('Cortex XSIAM ingests normalized telemetry across networks, clouds, and endpoints, utilizing machine learning algorithms to suppress background noise and correlate isolated indicators into a single incident graph.', '4. AI Correlation & Incident Graph Generation:'),
  bullet('High-confidence intrusions trigger automated SOAR containment playbooks: terminating network sessions, isolating host network adapters via Cortex XDR, and revoking user credentials across identity providers.', '5. Automated Containment & SOAR Execution:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// CHAPTER 5: OUTPUT SCREENS & VERIFICATION
// ============================================================================
docChildren.push(
  h1('5. OUTPUT SCREENS / LAB WORK'),
  p('This section documents the practical verification, console outputs, and certificates earned during the internship program:'),
  h2('5.1 Wireshark Packet Inspection & Deep Protocol Analysis'),
  p(
    'Demonstrated protocol analysis capturing TCP three-way handshake sequences (SYN, SYN-ACK, ACK), HTTP GET/POST headers, DNS query resolutions, and ARP address mappings. Verified encapsulated header fields across OSI Layer 2 (Ethernet MAC), Layer 3 (IPv4/IPv6), Layer 4 (TCP/UDP), and Layer 7 (Application payload).',
    { align: AlignmentType.JUSTIFY }
  ),
  h2('5.2 Docker Container Bridge Security & Image Scanning'),
  p(
    'Configured isolated Docker container bridge networks. Conducted automated vulnerability scans of container images, identifying common vulnerabilities and exposures (CVEs), library dependencies, and verifying non-root user execution enforcement.',
    { align: AlignmentType.JUSTIFY }
  ),
  h2('5.3 Palo Alto Next-Generation Firewall Security Policy Configuration'),
  p(
    'Configured security policies, security zones (Trust, Untrust, DMZ), App-ID signatures, and User-ID mappings on the Next-Generation Firewall console. Verified that traffic matching forbidden application signatures was blocked regardless of destination port.',
    { align: AlignmentType.JUSTIFY }
  ),
  h2('5.4 Cortex XDR & Cortex XSIAM Incident Triage Console'),
  p(
    'Demonstrated unified incident timeline views in Cortex XSIAM, visualizing end-to-end attack progression from phishing lure execution to host containment. Verified automatic alert grouping, severity scoring, and SOAR playbook execution.',
    { align: AlignmentType.JUSTIFY }
  ),
  h2('5.5 Credentials & Certificates Earned'),
  p('The following official credentials were awarded by Palo Alto Networks and AICTE – EduSkills upon rigorous assessment:'),
  makeTable(
    ['Certificate / Module Track', 'Issuing Body', 'Completion Date', 'Status'],
    [
      ['Cybersecurity Fundamentals', 'Palo Alto Networks', 'July 4, 2026', 'Certified'],
      ['Network Security Fundamentals', 'Palo Alto Networks', 'July 6, 2026', 'Certified'],
      ['Cloud Security Fundamentals', 'Palo Alto Networks', 'July 8, 2026', 'Certified'],
      ['Security Operations Fundamentals', 'Palo Alto Networks', 'June 30, 2026', 'Certified'],
      ['AI in Cybersecurity Fundamentals', 'Palo Alto Networks', 'July 22, 2026', 'Certified'],
      ['Certificate of Virtual Internship (Final)', 'AICTE – EduSkills / Palo Alto Networks', 'August 2026', 'Grade O (Outstanding)']
    ],
    [3200, 2800, 1800, 1700]
  ),
  new Paragraph({ spacing: { before: 200, after: 100 } }),
  p('Figure 5.1: Cybersecurity Fundamentals Certificate', { align: AlignmentType.CENTER, bold: true, size: 22 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [new ImageRun({ data: certFundamentals, transformation: { width: 440, height: 300 } })]
  }),
  p('Figure 5.2: Network Security Fundamentals Certificate', { align: AlignmentType.CENTER, bold: true, size: 22 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [new ImageRun({ data: certNetwork, transformation: { width: 440, height: 300 } })]
  }),
  p('Figure 5.3: Cloud Security Fundamentals Certificate', { align: AlignmentType.CENTER, bold: true, size: 22 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [new ImageRun({ data: certCloud, transformation: { width: 440, height: 300 } })]
  }),
  p('Figure 5.4: Security Operations Fundamentals Certificate', { align: AlignmentType.CENTER, bold: true, size: 22 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [new ImageRun({ data: certSecOps, transformation: { width: 440, height: 300 } })]
  }),
  p('Figure 5.5: AI in Cybersecurity Fundamentals Certificate', { align: AlignmentType.CENTER, bold: true, size: 22 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [new ImageRun({ data: certAI, transformation: { width: 440, height: 300 } })]
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// CHAPTER 6: INTERNSHIP FEEDBACK
// ============================================================================
docChildren.push(
  h1('6. INTERNSHIP FEEDBACK (Experience)'),
  h2('6.1 About Company'),
  p(
    'Palo Alto Networks is a global leader in cybersecurity, renowned for revolutionizing network protection through the development of the world\'s first Next-Generation Firewall (NGFW). Today, the company leads enterprise security through three comprehensive technology pillars: Strata (Enterprise Network Security & NGFW), Prisma (Cloud Security & SASE), and Cortex (AI-Driven Security Operations, XDR, and XSIAM). Palo Alto Networks is widely recognized as a premier innovator applying precision AI, machine learning, and automated orchestration to protect critical enterprise infrastructure worldwide.',
    { align: AlignmentType.JUSTIFY }
  ),
  p(
    'EduSkills Foundation is a non-profit social enterprise dedicated to empowering youth and advancing technical education across India in collaboration with the All India Council for Technical Education (AICTE), Ministry of Education, Government of India. Through the National Internship Portal, EduSkills connects engineering students with global technology leaders to deliver rigorous, industry-certified virtual internships.',
    { align: AlignmentType.JUSTIFY }
  ),

  h2('6.2 Experience in Internship'),
  p(
    'The 8-week virtual internship delivered an exceptional blend of structured academic rigor and practical industry exposure. The progression across the five certified knowledge modules allowed me to cultivate a cohesive, end-to-end understanding of how modern cyber defense operations are designed, implemented, and maintained. Rather than studying tools in isolation, the program demonstrated how perimeter NGFWs, cloud container security, automated SOC workflows, and artificial intelligence models operate as an integrated defensive mesh.',
    { align: AlignmentType.JUSTIFY }
  ),
  p(
    'The weekly assessments and hands-on laboratory modules enforced personal accountability, while the technical documentation requirements improved my ability to clearly articulate complex security concepts. Successfully completing the program with an Outstanding (Grade O) rating has significantly boosted my confidence in pursuing advanced technical roles in the cybersecurity domain.',
    { align: AlignmentType.JUSTIFY }
  ),

  h2('6.3 Challenges Faced'),
  bullet('Balancing an intensive 8-week curriculum, weekly quizzes, and technical documentation alongside university academic coursework demanded rigorous time management.', 'Self-Paced Learning Discipline:'),
  bullet('Configuring virtual bridge networks, container sandboxes, and packet inspection filters without physical lab instructors required independent troubleshooting and deep RFC documentation reading.', 'Technical Lab Troubleshooting:'),
  bullet('Understanding advanced cloud-native architectures, container orchestration boundaries, and automated SOAR playbook execution logic required extensive supplementary study.', 'Advanced Conceptual Depth:'),
  bullet('Grasping how machine learning algorithms (supervised learning, Gini impurity, deep neural networks) model threat behaviors and eliminate false positives required bridging mathematical theory with practical security telemetry.', 'AI & Mathematical Telemetry Models:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// CHAPTER 7: CONCLUSIONS AND FUTURE SCOPE
// ============================================================================
docChildren.push(
  h1('7. CONCLUSIONS AND FUTURE SCOPE'),
  p(
    'The Summer Industry Internship – I on Cybersecurity Virtual Internship (Palo Alto Networks) successfully fulfilled all its pedagogical and practical objectives. Through systematic engagement across five certified tracks, the internship established a robust conceptual and practical mastery of enterprise defense—spanning the cyberthreat landscape, next-generation firewall engineering, cloud-native container security, SOC automation, and precision AI threat prevention.',
    { align: AlignmentType.JUSTIFY }
  ),
  p(
    'The experience proved that modern cybersecurity cannot rely on static perimeter defenses or manual incident reviews. Securing contemporary digital infrastructure demands a continuous Zero Trust posture, deep application-level inspection, cloud-delivered threat intelligence, and automated response orchestration.',
    { align: AlignmentType.JUSTIFY }
  ),
  p(
    'Looking ahead, the practical skills and theoretical grounding acquired during this internship provide a strong springboard for future academic research and professional certifications. Immediate future objectives include:',
    { align: AlignmentType.JUSTIFY }
  ),
  bullet('Preparing for official Palo Alto Networks Certified Cybersecurity Associate (PCCSA) and Certified Network Security Administrator (PCNSA) examinations.', 'Vendor Certification Pathways:'),
  bullet('Developing a local home-lab Security Operations Center deploying open-source SIEM/SOAR tooling to write custom automated threat hunting playbooks.', 'Practical SOC Lab Expansion:'),
  bullet('Investigating the application of advanced Transformer-based AI models for detecting obfuscated phishing links and zero-day command-and-control beacons.', 'Applied Research in AI Cyber Defense:'),
  bullet('Applying core networking, cryptography, and container security principles to final-year capstone engineering projects and secure software development.', 'Academic Coursework Integration:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// BIBLIOGRAPHY
// ============================================================================
docChildren.push(
  h1('BIBLIOGRAPHY'),
  p('[1] Palo Alto Networks. (2024). Next-Generation Firewall Architecture and PAN-OS Fundamentals. Santa Clara, CA: Palo Alto Networks Documentation.', { before: 100, after: 100 }),
  p('[2] National Institute of Standards and Technology (NIST). (2024). Framework for Improving Critical Infrastructure Cybersecurity (Version 2.0). NIST Cybersecurity Framework.', { before: 100, after: 100 }),
  p('[3] Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). Zero Trust Architecture. NIST Special Publication 800-207.', { before: 100, after: 100 }),
  p('[4] Palo Alto Networks. (2024). Precision AI: Revolutionizing Enterprise Threat Prevention and Security Operations. Palo Alto Networks Technical Whitepaper.', { before: 100, after: 100 }),
  p('[5] Comer, D. E. (2018). Computer Networks and Internets (6th ed.). Pearson Education.', { before: 100, after: 100 }),
  p('[6] Stallings, W. (2022). Cryptography and Network Security: Principles and Practice (8th ed.). Pearson Education.', { before: 100, after: 100 }),
  p('[7] Wireshark Foundation. (2024). Wireshark User’s Guide (Version 4.2). Retrieved from https://www.wireshark.org/docs/', { before: 100, after: 100 }),
  p('[8] Docker Inc. (2024). Docker Container Security and Bridge Networking Documentation. Retrieved from https://docs.docker.com/engine/security/', { before: 100, after: 100 }),
  p('[9] Internet Engineering Task Force (IETF). (2018). The Transport Layer Security (TLS) Protocol Version 1.3. RFC 8446.', { before: 100, after: 100 }),
  p('[10] AICTE & EduSkills Foundation. (2026). Cybersecurity Virtual Internship Program Guidelines and Curriculum. National Internship Portal.', { before: 100, after: 100 }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// APPENDIX A: SECURITY TECHNOLOGIES & MODERN DEFENSE ARCHITECTURE
// ============================================================================
docChildren.push(
  h1('Appendix-A: Security Technologies & Modern Defense Architecture'),
  p(
    'The Cybersecurity Virtual Internship was developed around an enterprise-grade technology stack representing leading industry standards across network, cloud, endpoint, and operations domains.',
    { align: AlignmentType.JUSTIFY }
  ),
  h2('Network Defense Technologies:'),
  bullet('Palo Alto Networks signature engine that identifies applications regardless of port, protocol, or SSL encryption.', 'App-ID (Application Identification):'),
  bullet('Integrates firewall policy with enterprise directory services (Active Directory, LDAP) to bind IP sessions to individual users.', 'User-ID (User Identification):'),
  bullet('Automated cloud-based threat sandboxing that detonates unknown files, generating zero-day protections distributed globally in seconds.', 'WildFire Threat Analysis:'),
  bullet('Open-source protocol analyzer used for packet capture, stream reassembly, and deep packet header inspection.', 'Wireshark Protocol Analyzer:'),

  h2('Cloud Security & Containerization:'),
  bullet('Lightweight operating-system-level virtualization platform used for container deployment and security isolation.', 'Docker Engine & Bridge Networking:'),
  bullet('Cloud-delivered Secure Access Service Edge (SASE) platform providing Zero Trust Network Access (ZTNA 2.0).', 'Prisma Access:'),
  bullet('The 4 C\'s framework (Cloud, Clusters, Containers, Code) ensuring multi-layer defense in DevSecOps pipelines.', 'Cloud-Native Security Matrix:'),

  h2('Security Operations & Artificial Intelligence:'),
  bullet('Extended Detection and Response platform correlating network, endpoint, and cloud telemetry.', 'Cortex XDR:'),
  bullet('AI-driven unified security operations platform replacing traditional SIEM, SOAR, and SOC dashboards into a single data model.', 'Cortex XSIAM:'),
  bullet('Palo Alto Networks framework combining machine learning, deep learning, and generative AI for autonomous defense.', 'Precision AI:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// APPENDIX B: UNIFIED MODELING LANGUAGE (UML) IN CYBERSECURITY
// ============================================================================
docChildren.push(
  h1('Appendix-B: Unified Modeling Language (UML) in Cybersecurity'),
  p(
    'Throughout the software engineering lifecycle and architectural analysis of the internship, Unified Modeling Language (UML) was applied to systematically specify, visualize, and document security processes.',
    { align: AlignmentType.JUSTIFY }
  ),
  h2('1. Use Case Diagrams:'),
  bullet('To capture functional security requirements and map interactions between actors and defense capabilities.', 'Purpose:'),
  bullet('End User, SOC Analyst, Security Administrator, Threat Actor, Precision AI Engine.', 'Key Actors:'),
  bullet('Authenticate User, Inspect Ingress Traffic, Sandbox Unknown File, Isolate Compromised Host, Enforce Security Policy, Automate Playbook Execution.', 'Key Use Cases:'),

  h2('2. Class Diagrams:'),
  bullet('To model the static structural organization of network security entities and object schemas.', 'Purpose:'),
  bullet('SecurityZone, NetworkPacket, FirewallRule, ThreatIndicator, IncidentTicket, SOARPlaybook, CortexSensor.', 'Classes Modeled:'),
  bullet('Encapsulates attributes (packetId, srcIp, destIp, payloadBytes) and methods (parseProtocol, computeHash) for object-oriented inspection.', 'Class Design:'),

  h2('3. Sequence Diagrams:'),
  bullet('To illustrate the chronological sequence of messages and API calls during real-time threat detection and mitigation.', 'Purpose:'),
  bullet('User Traffic Request -> NGFW Decryption & DPI -> WildFire Sandboxing -> Threat Verdict -> Cortex XSIAM Alerting -> SOAR Endpoint Isolation.', 'Key Scenarios Modeled:'),

  h2('4. Activity Diagrams:'),
  bullet('To map the dynamic execution workflow and branching logic of packet filtering and automated threat response.', 'Purpose:'),
  bullet('Start -> Intercept Packet -> Rule Match Evaluation -> Deep Inspection -> Sandbox Detonation -> Quarantine Host / Allow Session -> End.', 'Processes Modeled:'),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// APPENDIX C: ABSTRACT
// ============================================================================
docChildren.push(
  h1('Appendix C: Abstract'),
  p(
    'The Summer Industry Internship – I on “Cybersecurity Virtual Internship (Palo Alto Networks)” is an intensive 8-week technical program undertaken under the AICTE – EduSkills Virtual Internship Program, supported by the Ministry of Education, Government of India. The project focuses on the design, analysis, and implementation of modern enterprise cyber defense architectures, addressing the vulnerabilities inherent in legacy perimeter-centric network models.',
    { align: AlignmentType.JUSTIFY }
  ),
  p(
    'The curriculum spans five certified knowledge domains: Cybersecurity Fundamentals, Network Security Fundamentals, Cloud Security Fundamentals, Security Operations Fundamentals, and AI in Cybersecurity Fundamentals. Students gain hands-on proficiency in deep packet inspection using Wireshark, Docker container isolation and vulnerability auditing, Next-Generation Firewall (NGFW) policy enforcement with App-ID and User-ID, cloud sandboxing via WildFire, and AI-driven security operations through Cortex XDR and Cortex XSIAM. By combining rigorous theoretical frameworks with practical laboratory exercises, the internship delivers an integrated Zero Trust and automated response defense model capable of countering sophisticated, multi-stage cyber threats. The internship concluded with an Outstanding (Grade O) certification, establishing practical competence for advanced cybersecurity engineering.',
    { align: AlignmentType.JUSTIFY }
  ),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// APPENDIX D: CORRELATION TABLE
// ============================================================================
docChildren.push(
  h1('Appendix D: Correlation between the Summer Industry Internship-I and the Program Outcomes (POs), Program Specific Outcomes (PSOs)'),
  makeTable(
    ['S.No', 'Internship Activity / Learning Outcome', 'PO(s) Mapped', 'PSO(s) Mapped', 'SDG(s) Mapped'],
    [
      [
        '1',
        'Applied networking protocols, OSI/TCP-IP models, and cryptographic algorithms to analyze packet encapsulation and enforce firewall policies.',
        'PO1, PO2, PO5',
        'PSO1, PSO2',
        'SDG9 – Industry, Innovation & Infrastructure'
      ],
      [
        '2',
        'Analyzed the 7-stage Cyber-Attack Lifecycle, threat categorization (malware, phishing, DDoS), and designed multi-tier Zero Trust architectures.',
        'PO2, PO3',
        'PSO1, PSO2',
        'SDG9 – Industry, Innovation & Infrastructure'
      ],
      [
        '3',
        'Implemented cloud-native security controls, Docker container bridge networking, and container image vulnerability auditing.',
        'PO3, PO5',
        'PSO2, PSO3',
        'SDG9 – Build resilient infrastructure, foster innovation'
      ],
      [
        '4',
        'Investigated network traffic streams using Wireshark packet analyzer to detect protocol anomalies, malformed packets, and credential leaks.',
        'PO4, PO5',
        'PSO2',
        'SDG9 – Industry, Innovation & Infrastructure'
      ],
      [
        '5',
        'Explored Palo Alto Networks Precision AI framework, Cortex XSIAM unified data models, and automated SOAR containment playbooks.',
        'PO5, PO12',
        'PSO3',
        'SDG8 – Decent Work & Economic Growth'
      ],
      [
        '6',
        'Studied professional ethics, responsible vulnerability disclosure, and compliance frameworks (NIST CSF, ISO 27001) in cybersecurity.',
        'PO6, PO8',
        'PSO1',
        'SDG16 – Peace, Justice & Strong Institutions'
      ],
      [
        '7',
        'Managed weekly self-paced study plans, completed module assessments, documented technical results, and maintained reporting timelines.',
        'PO9, PO10, PO11',
        'PSO2',
        'SDG4 – Quality Education'
      ],
      [
        '8',
        'Engaged in lifelong learning by adapting to emerging paradigms including SASE, ZTNA 2.0, autonomous SOCs, and adversarial AI defense.',
        'PO12',
        'PSO3',
        'SDG4 – Quality Education'
      ]
    ],
    [600, 4200, 1400, 1400, 1900]
  ),
  new Paragraph({ spacing: { before: 200, after: 100 } }),
  makeTable(
    ['Batch No.: 01', 'Title: Cybersecurity Virtual Internship (Palo Alto Networks)'],
    [
      ['Roll no.', 'Name'],
      ['25315A6201', 'Srikrishna Eitta']
    ],
    [3000, 6500]
  ),
  new Paragraph({ spacing: { before: 300, after: 100 } }),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              p('STUDENT:', { bold: true, size: 22, before: 0, after: 20 }),
              p('Srikrishna Eitta', { bold: true, size: 24, before: 0, after: 20 }),
              p('25315A6201', { size: 22, before: 0, after: 0 })
            ]
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [
              p('INTERNSHIP COORDINATOR:', { bold: true, size: 22, before: 0, after: 20 }),
              p('Ponnam Rajesh', { bold: true, size: 24, before: 0, after: 20 }),
              p('Assistant Professor', { size: 22, before: 0, after: 20 }),
              p('Department of CSE (Cyber Security)', { size: 20, before: 0, after: 0 })
            ]
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              p('HOD-CSE (Cyber Security):', { bold: true, size: 22, before: 0, after: 20 }),
              p('Dr. V. Sowmya Devi', { bold: true, size: 24, before: 0, after: 20 }),
              p('Head, Department of CSE (Cyber Security)', { size: 20, before: 0, after: 20 }),
              p('Sreenidhi Institute of Sci. & Tech.', { size: 20, before: 0, after: 0 })
            ]
          })
        ]
      })
    ]
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================================
// APPENDIX E: DOMAIN AND NATURE OF INTERNSHIP
// ============================================================================
docChildren.push(
  h1('Appendix E: Domain of Internship and Nature of internship'),
  makeTable(
    [
      'Batch No.',
      'Title',
      'COMPUTER NETWORKS, CLOUD COMPUTING, INFORMATION SECURITY, CYBER SECURITY, DATA SCIENCE, DATA MINING AND IOT',
      'ARTIFICIAL INTELLIGENCE, MACHINE LEARNING AND DEEP LEARNING',
      'INTERNET OF THINGS, DATA WAREHOUSING, DATA MINING, BIG DATA ANALYTICS',
      'SOFTWARE ENGINEERING, SOFT COMPUTING'
    ],
    [
      [
        '01',
        'Cybersecurity Virtual Internship (Palo Alto Networks)',
        '√',
        '√',
        '',
        '√'
      ]
    ],
    [800, 2600, 2000, 1500, 1300, 1300]
  ),
  new Paragraph({ spacing: { before: 400, after: 100 } }),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              p('STUDENT:', { bold: true, size: 22, before: 0, after: 20 }),
              p('Srikrishna Eitta', { bold: true, size: 24, before: 0, after: 20 }),
              p('25315A6201', { size: 22, before: 0, after: 0 })
            ]
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [
              p('INTERNSHIP COORDINATOR:', { bold: true, size: 22, before: 0, after: 20 }),
              p('Ponnam Rajesh', { bold: true, size: 24, before: 0, after: 20 }),
              p('Assistant Professor', { size: 22, before: 0, after: 20 }),
              p('Department of CSE (Cyber Security)', { size: 20, before: 0, after: 0 })
            ]
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              p('HOD-CSE (Cyber Security):', { bold: true, size: 22, before: 0, after: 20 }),
              p('Dr. V. Sowmya Devi', { bold: true, size: 24, before: 0, after: 20 }),
              p('Head, Department of CSE (Cyber Security)', { size: 20, before: 0, after: 20 }),
              p('Sreenidhi Institute of Sci. & Tech.', { size: 20, before: 0, after: 0 })
            ]
          })
        ]
      })
    ]
  })
);

// Create Document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Times New Roman',
          size: 24
        }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      children: docChildren
    }
  ]
});

const outputPath = 'C:/Projects/Url analyzer/Cybersecurity_Internship_Report_Srikrishna_Eitta.docx';
console.log('Generating document...');
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document successfully generated at: ${outputPath} (${buffer.length} bytes)`);
});
