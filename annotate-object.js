// Get the business object ID of journal note
journalBusID = getJournalID();

if (journalBusID === null) {
  console.log('Error getting journal ID, exiting script.');
  return;
}

// Get the business object ID of the parent
parentBusID = getParentID(input["Parent Type Name"]);

if (parentBusID === null) {
  console.log('Error getting parent ID, exiting script.');
  return;
}

// Create journal template
var fieldNames = ['JournalTypeID', 'JournalTypeName', 'ParentTypeID', 'ParentRecID', 'Details'];

var template = getObjectTemplate(journalBusID, fieldNames);

// Set template values

template.setValue('JournalTypeID', journalBusID, true);
template.setValue('JournalTypeName', 'Journal - Note', true);
template.setValue('ParentTypeID', input['Parent Type Name'], true);
template.setValue('ParentRecID', input['Parent Rec ID'], true);
template.setValue('Details', input['Details'], true);

// template.fields
var payload = {
  'busObId': journalBusID,
  'busObRecId': '',
  'busObPublicId': '',
  'fields': template.fields
};

// Create annotation request
var annotateReq = http.request({
  'endpoint': 'Cherwell',
  'path': '/CherwellApi/api/V1/savebusinessobject',
  'method': 'POST',
  'headers': {
    'Content-Type': 'application/json'
  }
});

// Write annotation
var annotateResp = annotateReq.write(payload);
if (annotateResp.statusCode < 200 || annotateResp.statusCode > 299) {
  throw new Error('Error posting to Cherwell: ' + annotateResp.statusCode);
}


//---------------------------END OF MAIN FUNCTION-----------------------------------

/**
 * Helper function to get the object ID of the journal
 * Returns the ID of the journal type, or null
 */
function getJournalID() {
    var journalReq = http.request({
      'endpoint': 'Cherwell',
      'path': '/CherwellApi/api/V1/getbusinessobjectsummary/busobname/Journal',
      'method': 'GET'
    });
    
    var journalResp = journalReq.write();
    if (journalResp.statusCode != 200) {
      console.log('ERROR: Could not retrieve JournalNote Object ID');
      return null;
    }
    
    var journalData = JSON.parse(journalResp.body)[0]["groupSummaries"];
    for (var i in journalData) {
        if (journalData[i]["displayName"] === input["Journal Type Name"])
            return journalData[i]["busObId"];
    }

}



/**
 * Helper function to get the object ID of the parent
 * Returns the ID of the parent, or null
 */
function getParentID(parentName) {
    var parentReq = http.request({
      'endpoint': 'Cherwell',
      'path': '/CherwellApi/api/V1/getbusinessobjectsummary/busobname/' + parentName,
      'method': 'GET'
    });
    
    var parentResp = parentReq.write();
    if (parentResp.statusCode != 200) {
      console.log('ERROR: Could not retrieve Parent Object ID');
      return null;
    }
    
    var parentData = JSON.parse(parentResp.body)[0];
    if (parentData["displayName"] && parentData["displayName"] === parentName)
        return parentData["busObId"];
    else {
        var childData = parentData["groupSummaries"];
        for (var i in childData) {
            if (childData[i]["displayName"] === parentName)
                return childData[i]["busObId"];
        }
    }

}



/**
 * getObjectTemplate - Gets the template, complete with the
 *   field Ids and such. It adds a helper function called 
 *   setValue that will set the value of a field. Otherwise
 *   looping through and setting the field is a lot of code
 * 
 *  objId - The Object ID to get the template for
 *  fieldNames - An array of field names to retrieve
 */
function getObjectTemplate(objId, fieldNames) {
    var templateReq = http.request({
        'endpoint': 'Cherwell',
        'path': '/CherwellApi/api/V1/getbusinessobjecttemplate',
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json'
        }
    });
    
    var payload = {
        'busObId': objId,
        'includeRequired': false,
        'includeAll': false,
        'fieldNames': fieldNames
    };
    
    var templateResp = templateReq.write(payload);
    var templateData = JSON.parse(templateResp.body);
    
    
    // Build template
    var template = {};
    template.fields = templateData.fields;
    
    // This is a helper function for setting the value of 
    // a field. The "dirty" element isn't documented, but
    // seems to allow for some kind of escaping. 
    template.setValue = function (name, value, dirty) { 
        dirty = (dirty === null ? true : dirty);    
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