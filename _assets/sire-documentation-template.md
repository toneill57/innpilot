---
title: "[DOCUMENT_TITLE]"
description: "[Brief description of purpose and key information covered]"
type: "[sire_regulatory|sire_template|compliance_guide|hotel_process|tourism|restaurants|beaches|activities|culture|events|amenities|policies|guest_manual|services|facilities|procedures|rates|packages|transport|hotels|system_docs|general_docs]"
category: "[regulatory|technical|operational|business|tourism|hotel]"
status: "[active|draft|production-ready|archived]"
version: "1.0"
last_updated: "[YYYY-MM-DD]"
tags: ["[primary_domain]", "[document_type]", "[key_concept]"]
keywords: ["[key_term_1]", "[key_term_2]", "[key_term_3]", "[domain_specific_term]"]
language: "es"
---

# [DOCUMENT_TITLE]

## Overview {#overview}

**Q: ¿Qué es [MAIN_CONCEPT] y por qué es importante?**
**A:** [Brief explanation of the main concept, its purpose, and why it matters. Include key benefits and business impact.]

## [MAIN_SECTION_1] {#section-1}

**Q: ¿Cuáles son [SPECIFIC_QUESTION_1]?**
**A:** [Detailed answer with specifications, examples, and key information.]

- **[KEY_POINT_1]**: [Explanation with practical details]
- **[KEY_POINT_2]**: [Explanation with practical details] 
- **[KEY_POINT_3]**: [Explanation with practical details]

**[CRITICAL_NOTE]**: [Important warning or critical information users must know]

## [MAIN_SECTION_2] {#section-2}

**Q: ¿Cuáles son [SPECIFIC_QUESTION_2] y sus especificaciones?**
**A:** [Detailed answer with comprehensive information:]

### [SUB_CATEGORY_1]
1. **[ITEM_1]**: [Description and specifications]
2. **[ITEM_2]**: [Description and specifications]

### [SUB_CATEGORY_2]  
3. **[ITEM_3]**: [Description and format requirements]
4. **[ITEM_4]**: [Description and validation rules]
   - **Requires**: [Reference to {#section-reference} if needed]
   - **Prevents**: [Common error or issue]

### [SUB_CATEGORY_3]
5. **[ITEM_5]**: [Description]
6. **[ITEM_6]**: [Description]

**[FORMAT_NOTE]**: [Important formatting or technical requirement]

## [PROCESS_SECTION] {#process-steps}

**Q: ¿Cuáles son [PROCESS_QUESTION]?**
**A:** [Process overview and explanation:]

1. **[STEP_1]**: [Description of first step]
2. **[STEP_2]**: [Description of second step]
3. **[STEP_3]**: [Description with reference to {#section-reference}]
4. **[STEP_4]**: [Description]
5. **[STEP_5]**: [Description]
6. **[STEP_6]**: [Description]
7. **[STEP_7]**: [Final step description]

## Common Issues {#common-issues}

**Q: ¿Cuáles son [ERRORS_QUESTION] y cómo prevenirlos?**
**A:** [Number] [error types] más críticos:

### Error #1: [ERROR_TYPE_1] ([PERCENTAGE]% of failures)
- **Cause**: [Root cause description]
- **Impact**: [Business impact explanation]
- **Prevention**: [How to avoid this error, reference {#section-reference} if needed]

### Error #2: [ERROR_TYPE_2] ([PERCENTAGE]% of failures)  
- **Cause**: [Root cause description]
- **Impact**: [Business impact explanation]
- **Prevention**: [Prevention strategy]

### Error #3: [ERROR_TYPE_3] ([PERCENTAGE]% of failures)
- **Cause**: [Root cause description]
- **Impact**: [Business impact explanation]
- **Prevention**: [Prevention strategy]

### Error #4: [ERROR_TYPE_4] ([PERCENTAGE]% of failures)
- **Cause**: [Root cause description]
- **Impact**: [Business impact explanation]
- **Prevention**: [Prevention strategy referencing {#section-reference}]

### Error #5: [ERROR_TYPE_5] ([PERCENTAGE]% of failures)
- **Cause**: [Root cause description]
- **Impact**: [Business impact explanation]
- **Prevention**: [Prevention strategy]

## [AUTOMATION_SECTION] {#automation}

**Q: ¿Cómo automatiza [SYSTEM_NAME] [PROCESS_NAME]?**
**A:** [SYSTEM_NAME] automatizes [process description] through:

- **[FEATURE_1]**: [Automation capability description]
- **[FEATURE_2]**: [Automation capability with reference to {#process-steps}]
- **[FEATURE_3]**: [Automation capability referencing {#common-issues}]
- **[FEATURE_4]**: [Integration capability]
- **[FEATURE_5]**: [Monitoring and validation capability]

**[BENEFIT_STATEMENT]**: [Key benefit with percentage or measurable improvement]

---

## Template Usage Guide

### Target Ratio: 85% Content / 15% Metadata

**✅ Required Frontmatter Fields:**
- `title`: Document title (required)
- `type`: Document type for auto-classification (required - see list above)
- `description`: Brief purpose description
- `category`: Business categorization
- `status`: Document lifecycle status
- `tags`: Array format for better search
- `keywords`: Domain-specific terms for detection

**✅ Use Cross-References When:**
- Connecting related sections: `{#section-reference}`
- Referencing validation rules: `{#validation-section}`
- Linking to error prevention: `{#common-issues}`
- Maximum 2-3 references per section

**❌ Avoid:**
- Sub-concept IDs: `{#concept-sub-detail}`
- Excessive cross-reference chains
- Metadata comments in content
- Missing `type` field (breaks auto-classification)

**Document Type Selection:**
- **SIRE Domain**: `sire_regulatory`, `sire_template`, `compliance_guide`
- **Hotel Domain**: `hotel_process`, `amenities`, `policies`, `guest_manual`, `services`, `facilities`, `procedures`, `rates`, `packages`
- **Tourism Domain**: `tourism`, `restaurants`, `beaches`, `activities`, `culture`, `events`, `transport`, `hotels`
- **System Domain**: `system_docs`, `general_docs`

**Structure Guidelines:**
- Each main section gets one ID: `{#section-name}`
- Use Q&A format for semantic search optimization
- Include practical examples and specifications
- Focus on actionable content over theory
- Keep cross-references valuable and minimal
- Use domain-specific keywords for better auto-detection