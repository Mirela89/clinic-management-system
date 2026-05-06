package com.medicareplus.medical.analysis;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.doctor.Doctor;
import com.medicareplus.doctor.DoctorRepository;
import com.medicareplus.medical.consultation.Consultation;
import com.medicareplus.medical.consultation.ConsultationRepository;
import com.medicareplus.patient.Patient;
import com.medicareplus.patient.PatientRepository;
import com.medicareplus.support.TestDataFactory;
import com.medicareplus.user.User;
import com.medicareplus.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalAnalysisServiceImplTest {

    @Mock
    private MedicalAnalysisRepository medicalAnalysisRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private ConsultationRepository consultationRepository;

    @InjectMocks
    private MedicalAnalysisServiceImpl service;

    @Test
    void createAnalysisShouldPersistAndMapResponse() {
        User patientUser = TestDataFactory.user(1L, "patient", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(2L, "doctor", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(patientUser);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        MedicalAnalysisRequest request = new MedicalAnalysisRequest();
        request.setPatientId(1L);
        request.setDoctorId(2L);
        request.setAnalysisType(AnalysisType.MRI);
        request.setStatus(AnalysisStatus.PENDING);
        request.setRequestedDate(LocalDate.of(2030, 1, 1));
        request.setResultDate(LocalDate.of(2030, 1, 2));
        request.setMongoDocumentId("doc-1");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
        when(medicalAnalysisRepository.save(any(MedicalAnalysis.class))).thenAnswer(invocation -> {
            MedicalAnalysis analysis = invocation.getArgument(0);
            analysis.setId(10L);
            return analysis;
        });

        MedicalAnalysisResponse response = service.createAnalysis(request);

        assertEquals(10L, response.getId());
        assertEquals("MRI", response.getAnalysisType());
        assertEquals("First1 Last1", response.getPatientName());
    }

    @Test
    void createAnalysisShouldRejectConsultationPatientMismatch() {
        User patientUser = TestDataFactory.user(3L, "patient3", UserRole.PATIENT);
        User otherPatientUser = TestDataFactory.user(4L, "patient4", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(5L, "doctor5", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(patientUser);
        Patient otherPatient = TestDataFactory.patient(otherPatientUser);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        Consultation consultation = TestDataFactory.consultation(
                20L,
                TestDataFactory.appointment(21L, otherPatient, doctor)
        );
        MedicalAnalysisRequest request = new MedicalAnalysisRequest();
        request.setPatientId(3L);
        request.setDoctorId(5L);
        request.setConsultationId(20L);
        request.setAnalysisType(AnalysisType.XRAY);
        request.setStatus(AnalysisStatus.PENDING);
        request.setRequestedDate(LocalDate.of(2030, 1, 3));

        when(patientRepository.findById(3L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(consultationRepository.findById(20L)).thenReturn(Optional.of(consultation));

        assertThrows(BusinessException.class, () -> service.createAnalysis(request));
    }

    @Test
    void createAnalysisShouldRejectResultBeforeRequestedDate() {
        User patientUser = TestDataFactory.user(6L, "patient6", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(7L, "doctor7", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(patientUser);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        MedicalAnalysisRequest request = new MedicalAnalysisRequest();
        request.setPatientId(6L);
        request.setDoctorId(7L);
        request.setAnalysisType(AnalysisType.ECG);
        request.setStatus(AnalysisStatus.COMPLETED);
        request.setRequestedDate(LocalDate.of(2030, 1, 5));
        request.setResultDate(LocalDate.of(2030, 1, 4));

        when(patientRepository.findById(6L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(7L)).thenReturn(Optional.of(doctor));

        assertThrows(BusinessException.class, () -> service.createAnalysis(request));
    }

    @Test
    void updateAnalysisShouldRejectConsultationDoctorMismatch() {
        User patientUser = TestDataFactory.user(10L, "patient10", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(11L, "doctor11", UserRole.DOCTOR);
        User otherDoctorUser = TestDataFactory.user(12L, "doctor12", UserRole.DOCTOR);
        Patient patient = TestDataFactory.patient(patientUser);
        Doctor doctor = TestDataFactory.doctor(doctorUser);
        Doctor otherDoctor = TestDataFactory.doctor(otherDoctorUser);
        MedicalAnalysis existing = TestDataFactory.analysis(23L, patient, doctor);
        Consultation consultation = TestDataFactory.consultation(
                24L,
                TestDataFactory.appointment(25L, patient, otherDoctor)
        );
        MedicalAnalysisRequest request = new MedicalAnalysisRequest();
        request.setPatientId(10L);
        request.setDoctorId(11L);
        request.setConsultationId(24L);
        request.setAnalysisType(AnalysisType.CT_SCAN);
        request.setStatus(AnalysisStatus.IN_PROGRESS);
        request.setRequestedDate(LocalDate.of(2030, 2, 1));

        when(medicalAnalysisRepository.findById(23L)).thenReturn(Optional.of(existing));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(11L)).thenReturn(Optional.of(doctor));
        when(consultationRepository.findById(24L)).thenReturn(Optional.of(consultation));

        assertThrows(BusinessException.class, () -> service.updateAnalysis(23L, request));
    }

    @Test
    void getAnalysisByIdShouldMapResponse() {
        User patientUser = TestDataFactory.user(13L, "patient13", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(14L, "doctor14", UserRole.DOCTOR);
        MedicalAnalysis analysis = TestDataFactory.analysis(
                26L,
                TestDataFactory.patient(patientUser),
                TestDataFactory.doctor(doctorUser)
        );
        when(medicalAnalysisRepository.findById(26L)).thenReturn(Optional.of(analysis));

        MedicalAnalysisResponse response = service.getAnalysisById(26L);

        assertEquals(26L, response.getId());
        assertEquals("BLOOD_TEST", response.getAnalysisType());
        assertEquals("First14 Last14", response.getDoctorName());
    }

    @Test
    void getAnalysesByDoctorIdShouldMapResponses() {
        User patientUser = TestDataFactory.user(8L, "patient8", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(9L, "doctor9", UserRole.DOCTOR);
        MedicalAnalysis analysis = TestDataFactory.analysis(
                22L,
                TestDataFactory.patient(patientUser),
                TestDataFactory.doctor(doctorUser)
        );
        when(medicalAnalysisRepository.findByDoctorUserId(9L)).thenReturn(List.of(analysis));

        List<MedicalAnalysisResponse> responses = service.getAnalysesByDoctorId(9L);

        assertEquals(1, responses.size());
        assertEquals("First9 Last9", responses.getFirst().getDoctorName());
    }

    @Test
    void getAnalysesByPatientIdShouldMapResponses() {
        User patientUser = TestDataFactory.user(15L, "patient15", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(16L, "doctor16", UserRole.DOCTOR);
        MedicalAnalysis analysis = TestDataFactory.analysis(
                27L,
                TestDataFactory.patient(patientUser),
                TestDataFactory.doctor(doctorUser)
        );
        when(medicalAnalysisRepository.findByPatientUserId(15L)).thenReturn(List.of(analysis));

        List<MedicalAnalysisResponse> responses = service.getAnalysesByPatientId(15L);

        assertEquals(1, responses.size());
        assertEquals("First15 Last15", responses.getFirst().getPatientName());
    }

    @Test
    void deleteAnalysisShouldDeleteWhenPresent() {
        User patientUser = TestDataFactory.user(17L, "patient17", UserRole.PATIENT);
        User doctorUser = TestDataFactory.user(18L, "doctor18", UserRole.DOCTOR);
        MedicalAnalysis analysis = TestDataFactory.analysis(
                28L,
                TestDataFactory.patient(patientUser),
                TestDataFactory.doctor(doctorUser)
        );
        when(medicalAnalysisRepository.findById(28L)).thenReturn(Optional.of(analysis));

        service.deleteAnalysis(28L);

        verify(medicalAnalysisRepository).deleteById(28L);
    }
}
