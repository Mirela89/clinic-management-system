package com.medicareplus.insurance;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.patient.Patient;
import com.medicareplus.support.TestDataFactory;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsuranceServiceImplTest {

    @Mock
    private InsuranceRepository insuranceRepository;

    @InjectMocks
    private InsuranceServiceImpl service;

    @Test
    void createInsuranceShouldPersistAndMapResponse() {
        InsuranceRequest request = new InsuranceRequest();
        request.setProviderName("MediCare");
        request.setPolicyNumber("POL-1");
        request.setCoveragePercentage(90.0);
        request.setExpiryDate(LocalDate.of(2031, 1, 1));

        when(insuranceRepository.save(any(Insurance.class))).thenAnswer(invocation -> {
            Insurance insurance = invocation.getArgument(0);
            insurance.setId(1L);
            return insurance;
        });

        InsuranceResponse response = service.createInsurance(request);

        assertEquals(1L, response.getId());
        assertEquals("POL-1", response.getPolicyNumber());
        assertEquals(0, response.getPatientCount());
    }

    @Test
    void createInsuranceShouldRejectDuplicatePolicyNumber() {
        InsuranceRequest request = new InsuranceRequest();
        request.setPolicyNumber("POL-2");
        when(insuranceRepository.existsByPolicyNumber("POL-2")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createInsurance(request));
        verify(insuranceRepository, never()).save(any());
    }

    @Test
    void getAllInsurancesShouldMapPatientCount() {
        Insurance insurance = TestDataFactory.insurance(4L, "Provider", "POL-4");
        insurance.setPatients(List.of(new Patient()));
        when(insuranceRepository.findAll()).thenReturn(List.of(insurance));

        List<InsuranceResponse> responses = service.getAllInsurances();

        assertEquals(1, responses.size());
        assertEquals(1, responses.getFirst().getPatientCount());
    }

    @Test
    void updateInsuranceShouldRejectDuplicatePolicyNumber() {
        Insurance existing = TestDataFactory.insurance(5L, "Provider", "CURR");
        InsuranceRequest request = new InsuranceRequest();
        request.setPolicyNumber("NEW");

        when(insuranceRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(insuranceRepository.existsByPolicyNumber("NEW")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.updateInsurance(5L, request));
    }

    @Test
    void deleteInsuranceShouldRejectLinkedPatients() {
        Insurance existing = TestDataFactory.insurance(6L, "Provider", "POL-6");
        when(insuranceRepository.findById(6L)).thenReturn(Optional.of(existing));
        when(insuranceRepository.hasPatients(6L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.deleteInsurance(6L));
    }
}
