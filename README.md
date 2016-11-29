# RefData
A client/server for exposing slow moving, externally mastered, reference data over HTTP.

It is not recommended to use this service for sharing fast moving refenerence data, or data with inherent complexity since this would encourage the logic to be replicated in each consumer.

Good examples of refata are:

* VAT Rates
* EU countries
* Post Code Lookups

Bad examples of refdata are:

* FX Rates

## Index
* [API](https://github.com/guidesmiths/refdata/blob/master/README.md#api)
  -  [views/:id](https://github.com/guidesmiths/refdata/blob/master/README.md#viewsid)
  -  [views](https://github.com/guidesmiths/refdata/blob/master/README.md#views)
* [Concepts](https://github.com/guidesmiths/refdata/blob/master/README.md#concepts)
* [Adding Refdata](https://github.com/guidesmiths/refdata/blob/master/README.md#adding-refdata)
* [Clients](https://github.com/guidesmiths/refdata/blob/master/README.md#clients)
  -  [Node.js HTTP Client](https://github.com/guidesmiths/refdata/blob/master/README.md#node.js-http-client)
  -  [Node.js Local Client](https://github.com/guidesmiths/refdata/blob/master/README.md#node.js-local-client)

## API
### views/:id
### Request
| Methods | Route | Description |
|---------|-------|-------------|
| GET | /api/1.0/views/:id | Returns refdata for the specified view

#### Parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id                        | URL    | Yes |            | The data set id for the desired refdata |
| X&#8209;Request&#8209;ID  | Header |     | A new UUID | UUID for tracing the request across services |
| If&#8209;None&#8209;Match | Header |     |            | Specify the [ETag](https://en.wikipedia.org/wiki/HTTP_ETag) from the last response to get 304 if not modified |

### Response
#### Status Codes
| Code | Meaning |
|------|---------|
| 200  | Success |
| 304  | Not Modified |
| 404  | Unknown view (check for typos and that it's referenced in both server and client config) |
### Example
```
GET /api/1.0/views/uk-vat-rates
X-Request-ID: 414c6d1f-ee42-411f-83cb-a435487a52f9
```
```
HTTP/1.1 200 OK
X-Request-ID: 414c6d1f-ee42-411f-83cb-a435487a52f9
ETag: 686897696a7c876b7e
Cache-Control: max-age=3600

[
  {
    "start": "2011-01-04T00:00:00Z",
    "end": null,
    "data": {
      "standard": 0.2
    }
  },
  {
    "start": "2010-01-01T00:00:00Z",
    "end": "2011-01-04T00:00:00Z",
    "data": {
      "standard": 0.175
    }
  },
  {
    "start": "2008-12-01T00:00:00Z",
    "end": "2010-01-01T00:00:00Z",
    "data": {
      "standard": 0.15
    }
  },
  {
    "start": "1991-03-19T00:00:00Z",
    "end": "2008-12-01T00:00:00Z",
    "data": {
      "standard": 0.175
    }
  },
  {
    "start": "1979-06-18T00:00:00Z",
    "end": "1991-03-19T00:00:00Z",
    "data": {
      "standard": 0.15
    }
  }
]
```
### views
### Request
| Methods | Route | Description |
|---------|-------|-------------|
| GET | /api/1.0/view | Returns details about the refdata managed by the system

#### Parameters
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| X&#8209;Request&#8209;ID  | Header |     | A new UUID | UUID for tracing the request across services |

### Response
#### Status Codes
| Code | Meaning |
|------|---------|
| 200  | Success |
### Example
```
GET /api/1.0/views
X-Request-ID: 414c6d1f-ee42-411f-83cb-a435487a52f9
```
```
HTTP/1.1 200 OK
X-Request-ID: 414c6d1f-ee42-411f-83cb-a435487a52f9

{
  "non-uk-eu-msisdn-prefixes": {
    "description": "Non UK, EU MSISDN prefixes - required to price mobile usage",
    "from": "2016-10-05T23:00:00Z"
  },
  "uk-vat-rates": {
    "description": "A list of UK VAT Rates",
    "from": "1979-06-18T00:00:00Z"
  }
}
```
## Concepts
The RefData service has two main concepts, *Sources* and *Views*.

### Sources
A source is a set of time indexed documents containing general purpose reference data, e.g.
```
.
└── data
    ├── locations
    │   └── 2016-10-05T00-00-00Z.json <--- see below
    └── vat
        ├── 1979-06-18T00-00-00Z.json
        ├── 1991-03-19T00-00-00Z.json
        ├── 2008-12-01T00-00-00Z.json
        ├── 2010-01-01T00-00-00Z.json
        └── 2011-01-04T00-00-00Z.json
```

##### 2016-10-05T00-00-00Z.json
```
[
    {
        "common_name": "United Kingdom",
        "official_name": "United Kingdom of Great Britain and Northern Ireland",
        "type": "Sovereign State",
        "iso_code": "GB",
        "continent": "Europe",
        "continent_region": "Northern Europe",
        "country": "United Kingdom of Great Britain and Northern Ireland",
        "dialing_code": "44",
        "eu": true
    },
    {
        "common_name": "France",
        "official_name": "French Republic",
        "type": "Sovereign State",
        "iso_code": "FR",
        "continent": "Europe",
        "continent_region": "Western Europe",
        "country": "France",
        "dialing_code": "33",
        "eu": true
    },
    {
        "common_name": "Belgium",
        "official_name": "Kingdom of Belgium",
        "type": "Sovereign State",
        "iso_code": "BE",
        "continent": "Europe",
        "continent_region": "Western Europe",
        "country": "Belgium",
        "dialing_code": "32",
        "eu": true
    },
    {
        "common_name": "Belize",
        "official_name": "Belize",
        "type": "Sovereign State",
        "iso_code": "BZ",
        "continent": "North America",
        "continent_region": "Central America",
        "country": "Belize",
        "dialing_code": "501",
        "eu": false
    },
    ...
]
```

## Views
A view is a transformation of one or more sources designed for a specific purpose, e.g.

* A list of European Countries
* A list of International Countries
* A list of Non UK, European dialing prefixes
* A list of UK standard VAT rates

Views are generated at start time and represent their data with start and end dates so changes can be made ahead of time, e.g.
```
[
  {
    "start": "2011-01-04T00:00:00Z",
    "end": null,
    "data": {
      "standard": 0.2
    }
  },
  {
    "start": "2010-01-01T00:00:00Z",
    "end": "2011-01-04T00:00:00Z",
    "data": {
      "standard": 0.175
    }
  },
  {
    "start": "2008-12-01T00:00:00Z",
    "end": "2010-01-01T00:00:00Z",
    "data": {
      "standard": 0.15
    }
  },
  {
    "start": "1991-03-19T00:00:00Z",
    "end": "2008-12-01T00:00:00Z",
    "data": {
      "standard": 0.175
    }
  },
  {
    "start": "1979-06-18T00:00:00Z",
    "end": "1991-03-19T00:00:00Z",
    "data": {
      "standard": 0.15
    }
  }
]
```
## Adding refdata
1. Fork the github project
1. Create a new folder beneath the ```data``` directory for your source
1. Add the time indexed source files to that directory, using the format ```YYYY-MM-DDTHH-mm-ssZ.json```
1. Add the view to the ```views``` directory, e.g.
```
module.exports = {
    id: 'uk-vat-rates',
    description: 'A list of UK VAT Rates',
    source: 'vat',
    ttl: '1d',
    transform: (vat) => vat.uk
}
```
1. Update ```conf/default.js``` to reference the new view
1. Add some tests

## Clients
RefData Clients **must**:

* Cache refdata locally
* Utilise the ```Cache-Control``` HTTP header to periodically check for fresh content
* Utilise the ```ETag``` and ```If-None-Match``` to determine only get content when it changes

In addition clients **should**:

* Provide a time based API, e.g. ```client.getTemporal('uk-vat-rates', Date.now())```
* Make items immutable when adding them to it's cache
* Use the Node.js HTTP Client for reference

### Node.js HTTP Client
This project includes a refdata client for node.js.

#### Installation
```
npm i --save refdata
```

#### Usage
```
const Client = require('refdata').clients.http
const config = {
  url: 'https://refdata.example.com',
  views: ['uk-vat-rates']
}
Client.start(config, (err, client) => {
    if (err) throw err
    const vatRates = client.getTemporal('uk-vat-rates', Date.now())
    // Profit
})
```

### Node.js Local Client
This project also includes a local client which may be useful for testing, but **should not be used in production** as the data will get stale.

#### Usage
```
const Client = require('refdata').clients.local
const config = {
  views: ['uk-vat-rates']
}
Client.start(config, (err, client) => {
    if (err) throw err
    const vatRates = client.getTemporal('uk-vat-rates', Date.now())
    // Profit
})
```

