import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OncologyReportsComponent } from './oncology-reports/oncology-reports.component';
import {
  OncologyMonthlyIndicatorSummaryComponent
} from './oncology-reports/oncology-monthly-indicators/oncology-monthly-indicators.component';
import {
  OncologysummaryIndicatorsPatientListComponent
} from './oncology-reports/oncology-indicators-patient-list/oncology-indicators-patient-list.component';
import { AdminDashboardClinicFlowComponent } from '../hiv/clinic-flow/admin-dashboard-clinic-flow';
import { DataEntryStatisticsComponent } from './../../data-entry-statistics/data-entry-statistics.component';
import { DataEntryStatisticsPatientListComponent } from './../../data-entry-statistics/data-entry-statistics-patient-list.component';
import { PatientsProgramEnrollmentComponent } from '../../patients-program-enrollment/patients-program-enrollment.component';
import { ProgramEnrollmentPatientListComponent } from './../../patients-program-enrollment/program-enrollent-patient-list.component';
import { ChangeDepartmentComponent } from '../change-department/change-department.component';

const routes: Routes = [
  {
    path: 'oncology-reports',
    children: [
      {
        path: '',
        component: OncologyReportsComponent
      },
      {
        path: 'breast-cancer-screening-numbers',
        component: OncologyMonthlyIndicatorSummaryComponent,
      },
      {
        path: 'cervical-cancer-screening-numbers',
        component: OncologyMonthlyIndicatorSummaryComponent,
      },
      {
        path: ':screening-program/patient-list',
        component: OncologysummaryIndicatorsPatientListComponent,
      }
    ]
  },
  {
    path: 'clinic-flow', component: AdminDashboardClinicFlowComponent
  },
  {
    path: 'program-enrollment',
    children: [
      {
        path: '',
        component: PatientsProgramEnrollmentComponent
      },
      {
        path: 'patient-list',
        component: ProgramEnrollmentPatientListComponent
      }
    ]
  },
  {
    path: 'data-entry-statistics',
    children: [
      {
        path: '',
        component: DataEntryStatisticsComponent
      },
      {
        path: 'patient-list',
        component: DataEntryStatisticsPatientListComponent

      }
    ]
  },
  {
    path: 'select-department',
    component: ChangeDepartmentComponent
  }
];

export const DataAnalyticsDashboardOncologyRouting: ModuleWithProviders =
  RouterModule.forChild(routes);