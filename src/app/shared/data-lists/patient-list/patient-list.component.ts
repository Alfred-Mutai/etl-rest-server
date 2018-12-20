import {
  Component, OnInit, Input, Output,
  EventEmitter
} from '@angular/core';
import { PatientListColumns } from './patient-list-columns.data';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

let _ = require('lodash');

@Component({
  selector: 'patient-list',
  templateUrl: './patient-list.component.html'
})
export class PatientListComponent implements OnInit {

  @Input() public extraColumns: any;
  @Input() public overrideColumns: any;
  @Input() public data: any = [];
  @Input() public newList: any;
  public loadedTab: any;
  @Input()
  set options(value) {
    this._data.next(value);
  }
  get options() {
    return this._data.getValue();
  }
  @Input()
  set dataSource(value) {
    this._dataSource.next(value);
  }
  get dataSource() {
    return this._dataSource.getValue();
  }
  private _data = new BehaviorSubject<any>([]);
  private _dataSource = new BehaviorSubject<any>({});
  constructor(private router: Router) {
  }

  public ngOnInit() {
    this._data
      .subscribe((x) => {
        this.loadedTab = x;
      });
  }

  get columns() {
    let columns = PatientListColumns.columns();
    if (this.extraColumns && typeof Array.isArray(this.extraColumns)) {
      columns = _.concat(columns, this.extraColumns as Array<object>);
    }

    if (this.overrideColumns && _.isArray(this.overrideColumns)) {
      _.each(this.overrideColumns, (col) => {
        _.each(columns, (_col) => {
          if (col['field'] === _col['field']) {
            _.extend(_col, col);
          }
        });
      });
    }
    return columns;
  }

  get rowData() {

    let d: any = this.data || [];
    let count = 1;
    // console.log('Data', this.data);

    _.forEach(d, (row) => {
      if (!row['person_name']) {
        row['person_name'] = row['given_name'] + ' ' + row['family_name']
          + ' ' + row['middle_name'];
      }
      count++;
    });

    // console.log('Filtered Data', this.data);

    return this.data || [];
  }

  public loadSelectedPatient(event: any) {
    let patientUuid = '';
    if (event) {
      patientUuid = event.node.data.uuid;
    }

    if (patientUuid === undefined || patientUuid === null) {
      return;
    }

    this.router.navigate(['/patient-dashboard/patient/' + patientUuid +
      '/general/general/landing-page']);
  }

}