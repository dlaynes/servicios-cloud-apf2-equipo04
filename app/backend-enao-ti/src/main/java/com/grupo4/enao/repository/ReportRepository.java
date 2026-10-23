package com.grupo4.enao.repository;

import com.grupo4.enao.model.ApplicationData.ApplicationStatus;
import com.grupo4.enao.model.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Consultas agregadas de los reportes de RF-08 sobre los postulantes.
 * Se mantiene en un repositorio propio para no mezclar el CRUD con las
 * agregaciones y para que cada consulta quede identificada en el informe.
 */
@Repository
public interface ReportRepository extends JpaRepository<Applicant, Long> {

    @Query("""
            select a.applicationData.university, count(a) from Applicant a
            where a.applicationData.status = coalesce(:status, a.applicationData.status)
              and a.applicationData.campus  = coalesce(:campus, a.applicationData.campus)
              and a.applicationData.period  = coalesce(:period, a.applicationData.period)
            group by a.applicationData.university
            """)
    List<Object[]> countByUniversity(@Param("status") ApplicationStatus status,
                                     @Param("campus") String campus,
                                     @Param("period") String period);

    @Query("""
            select a.applicationData.period, count(a) from Applicant a
            where a.applicationData.status = coalesce(:status, a.applicationData.status)
              and a.applicationData.campus = coalesce(:campus, a.applicationData.campus)
              and a.applicationData.university = coalesce(:university, a.applicationData.university)
            group by a.applicationData.period
            """)
    List<Object[]> countByPeriod(@Param("status") ApplicationStatus status,
                                 @Param("campus") String campus,
                                 @Param("university") String university);

    @Query("""
            select a.applicationData.campus, count(a) from Applicant a
            where a.applicationData.status = coalesce(:status, a.applicationData.status)
              and a.applicationData.period = coalesce(:period, a.applicationData.period)
              and a.applicationData.university = coalesce(:university, a.applicationData.university)
            group by a.applicationData.campus
            """)
    List<Object[]> countByCampus(@Param("status") ApplicationStatus status,
                                 @Param("period") String period,
                                 @Param("university") String university);

    @Query("""
            select a.applicationData.status, count(a) from Applicant a
            where a.applicationData.university = coalesce(:university, a.applicationData.university)
              and a.applicationData.campus     = coalesce(:campus, a.applicationData.campus)
              and a.applicationData.period     = coalesce(:period, a.applicationData.period)
            group by a.applicationData.status
            """)
    List<Object[]> countByStatus(@Param("university") String university,
                                 @Param("campus") String campus,
                                 @Param("period") String period);

    @Query("select count(a) from Applicant a")
    long totalApplicants();
}