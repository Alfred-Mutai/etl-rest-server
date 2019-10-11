
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { GridOptions } from 'ag-grid';
import { RetentionReportResourceService } from '../../etl-api/retention-report-resource.service';
import * as _ from 'lodash';

@Component({
    selector: 'retention-report-patient-list',
    templateUrl: './retention-report-patient-list.component.html',
    styleUrls: ['./retention-report-patient-list.component.css']
})

export class RetentionReportPatientListComponent implements OnInit {

  public title = '';
  public patients: any = [];
  public rowData: any = [];
  public params: any;
  public busy: Subscription;
  public gridOptions: GridOptions = {
    enableColResize: true,
    enableSorting: true,
    enableFilter: true,
    showToolPanel: false,
    pagination: true,
    paginationPageSize: 300,
    onGridSizeChanged: () => {
      if (this.gridOptions.api) {
        this.gridOptions.api.sizeColumnsToFit();
      }
    },
    onGridReady: () => {
      if (this.gridOptions.api) {
        this.gridOptions.api.sizeColumnsToFit();
      }
    }
  };
  public retentionSummaryColdef: any = [
    {
      lockPosition: true,
      headerName: 'No',
      valueGetter: 'node.rowIndex + 1',
      cellClass: 'locked-col',
      width: 150,
      suppressNavigable: true
    },
    {
      headerName: 'Name',
      field: 'person_name',
      width: 600
    },
    {
      headerName: 'Program',
      field: 'program',
      width: 800
    },
    {
      headerName: 'Identifiers',
      field: 'identifiers',
      width: 600
    },
    {
      headerName: 'Gender',
      field: 'gender',
      width: 250
    },
    {
      headerName: 'Phone No',
      field: 'phone_number',
      width: 400
    },
    {
      headerName: 'Current VL',
      field: 'current_vl',
      width: 400
    },
    {
      headerName: 'Latest VL Date',
      field: 'current_vl_date',
      width: 400
    },
    {
      headerName: 'Previous Vl',
      field: 'previous_vl',
      width: 400
    },
    {
      headerName: 'Previous Vl Date',
      field: 'previous_vl_date',
      width: 400
    },
    {
      headerName: 'Current Regimen',
      field: 'cur_arv_meds',
      width: 800
    },
    {
      headerName: 'Alternative Phone No',
      field: 'alternate_phone_number',
      width: 500
    },
    {
      headerName: 'Last Appointment',
      field: 'last_appointment',
      width: 650
    },
    {
      headerName: 'Estate/Nearest Center',
      field: 'estate',
      width: 400
    },
    {
      headerName: 'Patient Uuid',
      field: 'patient_uuid',
      width: 300,
      hide: true
    }

  ];

  public busyIndicator: any = {
    busy: false,
    message: 'Please wait...' // default message
  };
  public errorObj = {
   'isError': false,
   'message': ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private retentionReportService: RetentionReportResourceService) {

  }

  public ngOnInit() {
    this.route
    .queryParams
    .subscribe((params: any) => {
        if (params) {
          this.getPatientList(params);
          this.title = this.translateIndicator(params.indicators);
          this.params = params;
        }
      }, (error) => {
        console.error('Error', error);
      });

  }

  public getPatientList(params) {
    this.loading();
    this.busy = this.retentionReportService.getRetentionReportPatientList(params)
      .subscribe((result: any) => {
        if (result) {
          const patients = result.result;
          this.createPatientRowData(patients);
          this.endLoading();
        }
      }, (error) => {
           this.endLoading();
           this.errorObj = {
            'isError': true,
            'message': 'An error occurred while trying to load the patient list.Please reload page'
          };
           console.error('ERROR', error);
      });
  }

  public translateIndicator(indicator: string) {
    const indicatorArray = indicator.toLowerCase().split('_');
      return indicatorArray.map((word) => {
            return ((word.charAt(0).toUpperCase()) + word.slice(1));
      }).join(' ');
  }

  public createPatientRowData(patients) {
    this.rowData = patients;
  }
  public navigateBack() {
    this.location.back();
  }
  public onCellClicked($event: any) {
    const patientUuid = $event.data.patient_uuid;
    this.redirectTopatientInfo(patientUuid);
  }
  public redirectTopatientInfo(patientUuid) {

    if (patientUuid === undefined || patientUuid === null) {
      return;
    }
    this.router.navigate(['/patient-dashboard/patient/' + patientUuid +
    '/general/general/landing-page']);

  }
  public loading() {
    this.busyIndicator = {
      busy: true,
      message: 'Fetching patient list...please wait'
    };
  }

  public endLoading() {
      this.busyIndicator = {
        busy: false,
        message: ''
      };
  }

  public resetErrorMsg() {
    this.errorObj = {
      'isError': false,
      'message': ''
    };
   }

  public exportPatientListToCsv() {
    this.gridOptions.api.exportDataAsCsv();
  }

}
