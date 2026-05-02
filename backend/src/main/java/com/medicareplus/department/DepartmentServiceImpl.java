package com.medicareplus.department;

import com.medicareplus.common.exception.BusinessException;
import com.medicareplus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        validateDepartmentName(request.getName(), null);

        Department department = new Department();
        applyChanges(department, request);

        return mapToResponse(departmentRepository.save(department));
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        return mapToResponse(findDepartment(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department department = findDepartment(id);
        validateDepartmentName(request.getName(), department.getName());

        applyChanges(department, request);

        return mapToResponse(departmentRepository.save(department));
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        findDepartment(id);
        if (departmentRepository.hasDoctors(id)) {
            throw new BusinessException("Department cannot be deleted because doctors are linked to it.");
        }
        departmentRepository.deleteById(id);
    }

    private Department findDepartment(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    private void validateDepartmentName(String requestedName, String currentName) {
        if (requestedName == null || requestedName.isBlank()) {
            return;
        }
        if (!requestedName.equalsIgnoreCase(currentName) &&
                departmentRepository.existsByNameIgnoreCase(requestedName)) {
            throw new BusinessException("Department name already in use.");
        }
    }

    private void applyChanges(Department department, DepartmentRequest request) {
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setFloor(request.getFloor());
    }

    private DepartmentResponse mapToResponse(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.getDescription(),
                department.getFloor(),
                department.getDoctors() != null ? department.getDoctors().size() : 0
        );
    }
}
