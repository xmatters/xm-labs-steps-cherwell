// Get incident summary and incident object ID
var incidentReq = http.request({
  'endpoint': 'Cherwell',
  'path': '/CherwellApi/api/V1/getbusinessobjectsummary/busobname/Incident',
  'method': 'GET'
});

var incidentResp = incidentReq.write();

if (incidentResp.statusCode != 200) {
  console.log('ERROR: Could not retrieve Incident Object ID');
  return null;
}

var incidentData = JSON.parse(incidentResp.body)[0];
var incidentObID = incidentData["busObId"];


// Get template for new incident fields
var fieldDisplayNames = ["Description", "Owned By Team",
"Created By ID", "Priority", "Customer Display Name", "Customer ID", "Service",
"Category", "Subcategory"];

var template = getObjectTemplate(incidentObID, fieldDisplayNames);

var fieldNames = ["Description", "OwnedByTeam", "CreatedByID",
"Priority", "CustomerDisplayName", "CustomerRecID", "Service", "Category",
"Subcategory"];


// fill in fields
for (var i in fieldDisplayNames) {
    if (input[fieldDisplayNames[i]]) 
        template.setValue(fieldNames[i], input[fieldDisplayNames[i]], true);
}

// take out fields not entered as inputs
template.fields = template.fields.filter(function(value, index, arr) {
    return input[fieldDisplayNames[index]];
});

// Create incident request

var payload = {
  'busObId': incidentObID,
  'busObRecId': '',
  'busObPublicId': '',
  'fields': template.fields
};

var createIncidentRequest = http.request({
    'endpoint': 'Cherwell',
    'method': 'POST',
    'path': 'CherwellAPI/api/V1/savebusinessobject',
    'headers': {
        'Content-Type': 'application/json'
    }
});

// Create Incident
var createIncidentResponse = createIncidentRequest.write( payload );
if (createIncidentResponse.statusCode < 200 || createIncidentResponse.statusCode > 299) {
  throw new Error('Error posting to Cherwell: ' + createIncidentResponse.statusCode);
}
output["Incident ID"] = JSON.parse(createIncidentResponse.body)["busObPublicId"];


//-------------------------END OF MAIN FUNCTION-------------------------------------

/**
 * Helper function to get the object template
 * 
 * Inputs
 * objId: object id for which to get the template, in this case incident object id
 * fieldNames: fields to request a template for
 * 
 * Outputs
 * template: has template for fields and setValue method to set their values
 **/
function getObjectTemplate(objId, fieldNames) {
    var req = http.request({
        'endpoint': 'Cherwell',
        'path': '/CherwellApi/api/V1/getbusinessobjecttemplate',
        'method': 'POST',
        'headers': {
          'Content-Type': 'application/json'
        }
    })  
    var payload = {
        'busObId': objId,
        'includeRequired': false,
        'includeAll': false,
        'fieldNames': fieldNames
    }   
    var temp = req.write(payload);
    var resp = JSON.parse(temp.body)    
    var template = {};
    template.fields = resp.fields   
    // This is a helper function for setting the value of 
    // a field. The "dirty" element isn't documented, but
    // seems to allow for some kind of escaping. 
    template.setValue = function (name, value, dirty) {
        dirty = (dirty === null ? true : dirty)   
        for (i in this.fields) {
            if (this.fields[i].name === name) {
                this.fields[i].value = value;
                this.fields[i].dirty = dirty;
                return;
            }
        }
    };
    return template;
}
