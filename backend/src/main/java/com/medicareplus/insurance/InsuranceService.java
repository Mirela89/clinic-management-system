package com.medicareplus.insurance;

import java.util.List;

public interface InsuranceService {

    InsuranceResponse createInsurance(InsuranceRequest request);

    InsuranceResponse getInsuranceById(Long id);

    List<InsuranceResponse> getAllInsurances();

    InsuranceResponse updateInsurance(Long id, InsuranceRequest request);

    void deleteInsurance(Long id);
}
