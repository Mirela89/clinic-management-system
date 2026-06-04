package com.medicareplus.medicalservice.medical.analysis.document;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisDocumentServiceImpl implements AnalysisDocumentService {

    private final AnalysisDocumentRepository repository;

    @Override
    public AnalysisDocumentResponse saveDocument(AnalysisDocumentRequest request) {
        log.info("Saving analysis document for analysisId: {}", request.getAnalysisId());

        AnalysisDocument document = new AnalysisDocument();
        document.setAnalysisId(request.getAnalysisId());
        document.setPatientId(request.getPatientId());
        document.setDoctorId(request.getDoctorId());
        document.setAnalysisType(request.getAnalysisType());
        document.setNotes(request.getNotes());
        document.setCreatedAt(LocalDate.now());
        document.setResults(request.getResults() == null ? List.of() :
                request.getResults().stream().map(r -> {
                    AnalysisResult result = new AnalysisResult();
                    result.setParameter(r.getParameter());
                    result.setValue(r.getValue());
                    result.setUnit(r.getUnit());
                    result.setNormalRange(r.getNormalRange());
                    result.setStatus(r.getStatus());
                    return result;
                }).collect(Collectors.toList())
        );

        AnalysisDocument saved = repository.save(document);
        log.info("Analysis document saved with mongoId: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public Optional<AnalysisDocumentResponse> getByAnalysisId(Long analysisId) {
        return repository.findFirstByAnalysisId(analysisId)
                .map(this::mapToResponse);
    }

    @Override
    public List<AnalysisDocumentResponse> getByPatientId(Long patientId) {
        return repository.findByPatientId(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AnalysisDocumentResponse> getByDoctorId(Long doctorId) {
        return repository.findByDoctorId(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AnalysisDocumentResponse mapToResponse(AnalysisDocument doc) {
        return new AnalysisDocumentResponse(
                doc.getId(),
                doc.getAnalysisId(),
                doc.getPatientId(),
                doc.getDoctorId(),
                doc.getAnalysisType(),
                doc.getResults(),
                doc.getNotes(),
                doc.getCreatedAt()
        );
    }
}