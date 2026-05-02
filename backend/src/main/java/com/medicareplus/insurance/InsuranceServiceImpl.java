package com.medicareplus.insurance;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsuranceServiceImpl implements InsuranceService {

    private final InsuranceRepository insuranceRepository;

    @Override
    @Transactional
    public InsuranceResponse createInsurance(InsuranceRequest request) {
        validatePolicyNumber(request.getPolicyNumber(), null);

        Insurance insurance = new Insurance();
        applyChanges(insurance, request);

        return mapToResponse(insuranceRepository.save(insurance));
    }

    @Override
    @Transactional(readOnly = true)
    public InsuranceResponse getInsuranceById(Long id) {
        return mapToResponse(findInsurance(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InsuranceResponse> getAllInsurances() {
        return insuranceRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InsuranceResponse updateInsurance(Long id, InsuranceRequest request) {
        Insurance insurance = findInsurance(id);
        validatePolicyNumber(request.getPolicyNumber(), insurance.getPolicyNumber());

        applyChanges(insurance, request);

        return mapToResponse(insuranceRepository.save(insurance));
    }

    @Override
    @Transactional
    public void deleteInsurance(Long id) {
        findInsurance(id);
        if (insuranceRepository.hasPatients(id)) {
            throw new BusinessException("Insurance cannot be deleted because patients are linked to it.");
        }
        insuranceRepository.deleteById(id);
    }

    private Insurance findInsurance(Long id) {
        return insuranceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance", id));
    }

    private void validatePolicyNumber(String requestedPolicyNumber, String currentPolicyNumber) {
        if (requestedPolicyNumber == null || requestedPolicyNumber.isBlank()) {
            return;
        }
        if (!requestedPolicyNumber.equals(currentPolicyNumber) &&
                insuranceRepository.existsByPolicyNumber(requestedPolicyNumber)) {
            throw new BusinessException("Policy number already in use.");
        }
    }

    private void applyChanges(Insurance insurance, InsuranceRequest request) {
        insurance.setProviderName(request.getProviderName());
        insurance.setPolicyNumber(request.getPolicyNumber());
        insurance.setCoveragePercentage(request.getCoveragePercentage());
        insurance.setExpiryDate(request.getExpiryDate());
    }

    private InsuranceResponse mapToResponse(Insurance insurance) {
        return new InsuranceResponse(
                insurance.getId(),
                insurance.getProviderName(),
                insurance.getPolicyNumber(),
                insurance.getCoveragePercentage(),
                insurance.getExpiryDate(),
                insurance.getPatients() != null ? insurance.getPatients().size() : 0
        );
    }
}
