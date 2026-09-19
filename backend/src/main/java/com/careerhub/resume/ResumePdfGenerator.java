package com.careerhub.resume;

import com.careerhub.exception.ApiException;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.stream.Collectors;

/** Renders the stored resume data into a simple, clean single page PDF. */
@Component
public class ResumePdfGenerator {

    private static final Color ACCENT = new Color(29, 78, 216);

    private final Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.BLACK);
    private final Font contactFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
    private final Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, ACCENT);
    private final Font itemTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
    private final Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

    public byte[] render(ResumeDtos.ResumeView resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 42, 42, 42, 42);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph(resume.personal().fullName(), nameFont));
            document.add(new Paragraph(contactLine(resume), contactFont));
            String links = linkLine(resume);
            if (!links.isBlank()) {
                document.add(new Paragraph(links, contactFont));
            }

            if (isFilled(resume.summary())) {
                section(document, "Professional summary");
                document.add(body(resume.summary()));
            }
            if (isFilled(resume.careerObjective())) {
                section(document, "Career objective");
                document.add(body(resume.careerObjective()));
            }

            if (!resume.education().isEmpty()) {
                section(document, "Education");
                for (var education : resume.education()) {
                    document.add(item(education.degree() + " - " + education.institution()));
                    document.add(body(join(" | ",
                            education.specialization(),
                            years(education.startYear(), education.endYear()),
                            education.grade() == null ? null : "Grade: " + education.grade())));
                }
            }

            if (!resume.skills().isEmpty()) {
                section(document, "Skills");
                document.add(body(resume.skills().stream()
                        .map(skill -> skill.skillName() + " (" + skill.proficiency().name().toLowerCase() + ")")
                        .collect(Collectors.joining(", "))));
            }

            if (!resume.projects().isEmpty()) {
                section(document, "Projects");
                for (var project : resume.projects()) {
                    document.add(item(project.title()));
                    if (isFilled(project.techStack())) {
                        document.add(body("Tech stack: " + project.techStack()));
                    }
                    if (isFilled(project.description())) {
                        document.add(body(project.description()));
                    }
                }
            }

            if (!resume.experience().isEmpty()) {
                section(document, "Experience");
                for (var experience : resume.experience()) {
                    document.add(item(experience.roleTitle() + " - " + experience.companyName()));
                    document.add(body(join(" | ",
                            experience.location(),
                            experience.startDate() == null ? null : experience.startDate()
                                    + " to " + (experience.currentlyWorking() ? "present"
                                    : String.valueOf(experience.endDate())))));
                    if (isFilled(experience.description())) {
                        document.add(body(experience.description()));
                    }
                }
            }

            if (!resume.certificates().isEmpty()) {
                section(document, "Certificates");
                for (var certificate : resume.certificates()) {
                    document.add(body(certificate.name() + " - " + certificate.issuingOrganization()
                            + " (" + certificate.status().name().toLowerCase() + ")"));
                }
            }

            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "The resume PDF could not be generated");
        }
    }

    private String contactLine(ResumeDtos.ResumeView resume) {
        var personal = resume.personal();
        return join(" | ", personal.email(), personal.phone(), personal.location(),
                personal.college(), personal.course());
    }

    private String linkLine(ResumeDtos.ResumeView resume) {
        var personal = resume.personal();
        return join(" | ", personal.githubUrl(), personal.linkedinUrl(), personal.portfolioUrl());
    }

    private String years(Integer start, Integer end) {
        if (start == null && end == null) {
            return null;
        }
        return (start == null ? "" : start) + " - " + (end == null ? "present" : end);
    }

    private void section(Document document, String title) {
        Paragraph paragraph = new Paragraph(title.toUpperCase(), sectionFont);
        paragraph.setSpacingBefore(14f);
        paragraph.setSpacingAfter(4f);
        document.add(paragraph);
    }

    private Paragraph item(String text) {
        Paragraph paragraph = new Paragraph(text, itemTitleFont);
        paragraph.setSpacingBefore(6f);
        return paragraph;
    }

    private Paragraph body(String text) {
        Paragraph paragraph = new Paragraph(text == null ? "" : text, bodyFont);
        paragraph.setAlignment(Element.ALIGN_LEFT);
        return paragraph;
    }

    private boolean isFilled(String value) {
        return value != null && !value.isBlank();
    }

    private String join(String separator, String... parts) {
        return List.of(parts).stream().filter(this::isFilled).collect(Collectors.joining(separator));
    }
}
