package com.medicareplus.userservice.insurance;

import com.medicareplus.userservice.insurance.InsuranceRequest;

import java.util.List;

public interface InsuranceService {

    InsuranceResponse createInsurance(InsuranceRequest request);

    InsuranceResponse getInsuranceById(Long id);

    List<InsuranceResponse> getAllInsurances();

    InsuranceResponse updateInsurance(Long id, InsuranceRequest request);

    void deleteInsurance(Long id);
}
