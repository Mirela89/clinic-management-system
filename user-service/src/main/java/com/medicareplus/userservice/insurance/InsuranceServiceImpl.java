package com.medicareplus.userservice.insurance;

import com.medicareplus.userservice.common.exception.BusinessException;
import com.medicareplus.userservice.common.exception.ResourceNotFoundException;
import com.medicareplus.userservice.insurance.InsuranceRepository;
import com.medicareplus.userservice.insurance.InsuranceRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsuranceServiceImpl implements InsuranceService {

    private final InsuranceRepository insuranceRepository;

    @Override
    @Transactional
    public InsuranceResponse createInsurance(InsuranceRequest request) {
        log.info("Creating insurance with policy number: {}", request.getPolicyNumber());
        validatePolicyNumber(request.getPolicyNumber(), null);

        Insurance insurance = new Insurance();
        applyChanges(insurance, request);

        InsuranceResponse response = mapToResponse(insuranceRepository.save(insurance));
        log.info("Insurance created successfully with id: {}", response.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public InsuranceResponse getInsuranceById(Long id) {
        log.debug("Fetching insurance with id: {}", id);
        return mapToResponse(findInsurance(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InsuranceResponse> getAllInsurances() {
        log.debug("Fetching all insurances");
        return insuranceRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InsuranceResponse updateInsurance(Long id, InsuranceRequest request) {
        log.info("Updating insurance with id: {}", id);
        Insurance insurance = findInsurance(id);
        validatePolicyNumber(request.getPolicyNumber(), insurance.getPolicyNumber());

        applyChanges(insurance, request);

        InsuranceResponse response = mapToResponse(insuranceRepository.save(insurance));
        log.info("Insurance updated successfully with id: {}", id);
        return response;
    }

    @Override
    @Transactional
    public void deleteInsurance(Long id) {
        log.info("Deleting insurance with id: {}", id);
        findInsurance(id);
        if (insuranceRepository.hasPatients(id)) {
            throw new BusinessException("Insurance cannot be deleted because patients are linked to it.");
        }
        insuranceRepository.deleteById(id);
        log.info("Insurance deleted successfully with id: {}", id);
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