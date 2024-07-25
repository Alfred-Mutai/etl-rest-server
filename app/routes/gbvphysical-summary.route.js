const authorizer = require('../../authorization/etl-authorizer');
const etlHelpers = require('../../etl-helpers');
const privileges = authorizer.getAllPrivileges();
const preRequest = require('../../pre-request-processing');
const {
  GBVPhysicalSummaryReportService
} = require('../../service/gbv-reports/gbvphysical-summary.service');
const routes = [
  {
    method: 'GET',
    path: '/etl/gbvphysical-summary',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        preRequest.resolveLocationIdsToLocationUuids(request, function () {
          let requestParams = Object.assign({}, request.query, request.params);
          let reportParams = etlHelpers.getReportParams(
            'gbvphysical-summary-report',
            ['endDate', 'locationUuids'],
            requestParams
          );
          reportParams.requestParams.isAggregated = true;

          let service = new GBVPhysicalSummaryReportService(
            'gbvphysical-summary-report',
            reportParams.requestParams
          );
          service
            .generateReport(reportParams.requestParams)
            .then((result) => {
              reply(result);
            })
            .catch((error) => {
              reply(error);
            });
        });
      },
      description: 'gbvphysical quarterly summary dataset',
      notes: 'gbvphysical quarterly summary dataset',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true
        },
        params: {}
      }
    }
  },
  {
    method: 'GET',
    path: '/etl/gbvphysical-summary-patient-list',
    config: {
      plugins: {
        hapiAuthorization: {
          role: privileges.canViewClinicDashBoard
        }
      },
      handler: function (request, reply) {
        if (request.query.locationUuids) {
          preRequest.resolveLocationIdsToLocationUuids(request, function () {
            let requestParams = Object.assign(
              {},
              request.query,
              request.params
            );
            let reportParams = etlHelpers.getReportParams(
              'gbvphysical-summary-report',
              ['endDate', 'locationUuids'],
              requestParams
            );
            delete reportParams.requestParams['gender'];
            const txmlReportService = new GBVPhysicalSummaryReportService(
              'gbvphysical-summary-report',
              reportParams.requestParams
            );
            txmlReportService
              .generatePatientListReport(reportParams.requestParams)
              .then((result) => {
                reply(result);
              })
              .catch((error) => {
                reply(error);
              });
          });
        }
      },
      description:
        'Get patient list for gbvphysical summary report of the location and month provided',
      notes: 'Returns patient list of gbvphysical summary indicators',
      tags: ['api']
    }
  }
];
exports.routes = (server) => server.route(routes);
