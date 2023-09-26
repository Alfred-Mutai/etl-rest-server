const _ = require('lodash');
const Moment = require('moment');

import { MultiDatasetPatientlistReport } from '../../app/reporting-framework/multi-dataset-patientlist.report.js';
import ReportProcessorHelpersService from '../../app/reporting-framework/report-processor-helpers.service';
const etlHelpers = require('../../etl-helpers.js');

const covid19MonthlyReportSections = require('../../app/reporting-framework/json-reports/covid-19/covid-19-monthly-report-indicators.json');
const covid19MonthlyReportPatientListCols = require('../../app/reporting-framework/json-reports/covid-19/covid-19-monthly-report-patient-list-cols.json');

export class Covid19MonthlyReport extends MultiDatasetPatientlistReport {
  constructor(reportName, params) {
    super(reportName, params);
    params.hivMonthlyDatasetSource = 'etl.hiv_monthly_report_dataset_frozen';
  }

  generateReport(additionalParams) {
    const that = this;
    return new Promise((resolve, reject) => {
      that
        .getSourceTables()
        .then((sourceTables) => {
          that.params.hivMonthlyDatasetSource =
            sourceTables.hivMonthlyDatasetSource;
          super.generateReport(additionalParams).then((results) => {
            if (additionalParams && additionalParams.type === 'patient-list') {
              resolve(results);
            } else {
              let finalResult = [];
              const reportProcessorHelpersService = new ReportProcessorHelpersService();
              for (let result of results) {
                if (
                  result.report &&
                  result.report.reportSchemas &&
                  result.report.reportSchemas.main &&
                  result.report.reportSchemas.main.transFormDirectives
                    .joinColumn
                ) {
                  finalResult = reportProcessorHelpersService.joinDataSets(
                    that.params[
                      result.report.reportSchemas.main.transFormDirectives
                        .joinColumnParam
                    ] ||
                      result.report.reportSchemas.main.transFormDirectives
                        .joinColumn,
                    finalResult,
                    result.results.results.results
                  );
                }
              }

              resolve({
                queriesAndSchemas: results,
                result: finalResult,
                sectionDefs: covid19MonthlyReportSections,
                indicatorDefinitions: []
              });
            }
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  getSourceTables() {
    const self = this;
    return new Promise((resolve, reject) => {
      let query = 'select * from etl.moh_731_last_release_month';
      let runner = self.getSqlRunner();

      runner
        .executeQuery(query)
        .then((results) => {
          const lastReleasedMonth = results[0]['last_released_month'];
          let sourceTables = {
            hivMonthlyDatasetSource: this.determineSourceTable(
              self.params.endingMonth,
              lastReleasedMonth
            )
          };

          resolve(sourceTables);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  determineSourceTable(month, lastReleasedMonth) {
    // set default source table to frozen table
    let sourceTable = 'etl.hiv_monthly_report_dataset_frozen';
    if (Moment(lastReleasedMonth).isSameOrAfter(Moment(month))) {
      sourceTable = 'etl.hiv_monthly_report_dataset_frozen';
    } else {
      sourceTable = 'etl.hiv_monthly_report_dataset_v1_2';
    }
    return sourceTable;
  }

  generatePatientListReport(reportParams) {
    const indicators = reportParams.requestIndicators.split(',') || [];
    let self = this;
    return new Promise((resolve, reject) => {
      super
        .generatePatientListReport(indicators)
        .then((results) => {
          let result = results.result;
          results['results'] = {
            results: result
          };
          results['patientListCols'] = covid19MonthlyReportPatientListCols;
          delete results['result'];
          _.each(results.results.results, (row) => {
            row.cur_meds = etlHelpers.getARVNames(row.cur_meds);
          });
          resolve(results);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}