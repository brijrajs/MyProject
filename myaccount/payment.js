var myAccount = new ultracart.MyAccount(merchantId);
var templates = {};
var creditCard = null;

// ---------------------------------------------------------
// Security (well, not really security, but a helper to
// redirect the user if they're not logged in.  Security
// is handled by the REST API.
// ---------------------------------------------------------
var redirectToLogin = function () {
  var location_href = "/cgi-bin/UCMyAccount?merchantId=" + window.merchantId;
  if (location.hash && location.hash.length > 0) {
    location_href += "&hash=" + location.hash.substring(1);
  }
  location.href = location_href;
};

var theDocument = jQuery(document);
// ajaxSend isn't need.  authentication is done via cookies that should already be present with every request.
//theDocument.ajaxSend(function (event, xhr) {
//    var authToken = $.cookie('access_token');
//    if (authToken) {
//        xhr.setRequestHeader("Authorization", "Bearer " + authToken);
//    }
//});

theDocument.ajaxError(function (event, xhr) {
  if (xhr.status == 401)
    redirectToLogin();
});


jQuery.ajaxSetup({ cache: false });


// ===============================================================================
//  BEGIN PCI 3.0 compliance code
//  What you might need to change:
//     the selector properties point to the two credit card fields.  If you change the
//     ids of the fields, you need to re-point those selectors at the fields properly.
//  See also:
//  http://docs.ultracart.com/display/ucdoc/UltraCart+Hosted+Credit+Card+Fields
// ===============================================================================
  var hostedFields = null;

  // setup should be called each time the UI updates.
  function setupSecureCreditCardFields() {
  // set this to true to see verbose debugging.  usually only UltraCart support will use this.
    window.ultraCartHostedFieldsDebugMode = false;
    hostedFields = UltraCartHostedFields.setup(jQuery, JSON, {
      'sessionCredentials': {
        'merchantId': merchantId
      },
      'hostedFields': {
        'creditCardNumber': {
          'selector': '#cardNumber',
          'callback': function(card){
            console.log(card);
            if(card && card.token){
              var tokenField = jQuery('#creditCardNumberToken');
              if(tokenField && tokenField.length){
                tokenField.val(card.token);
              }
            }
          }
        }
      },
      'overlayZIndex': 999
    });
  }


  // teardown should be called each time a UI needs destroying.
  function teardownSecureCreditCardFields() {
    if (hostedFields != null) {
      hostedFields.destroy();
      hostedFields = null;
    }
  }

// ==========================================================================
// END PCI 3.0 compliance code
// ==========================================================================


function initialize() {

  // find the card record id (if edit).
  var params = uc.commonFunctions.parseHttpParameters();

  var id = null;
  if (params['id'] && params['id'].length) {
    id = params['id'][0];

  }

  loadCreditCard(id);
}

// Made these functions to handle the years, months and types.
// I noticed that if you were adding a new card, an error was thrown because these values weren't defined.
// This function can be called in loadCreditCard() to set the years in that case as well.
function addCcYears(cardExpYear) {
  var years = '';
  var dt = new Date();
  var year = dt.getFullYear();
  var expYear = null;

  for (var i = 0; i < 20; i++) {
    expYear = year + i;
    if(cardExpYear && expYear === cardExpYear){
      // years.push({expYear, selected:'true'});
      years += '<option value="' + expYear + '" selected>' + expYear + '</option>';
    } else {
      // years.push({expYear, selected:'false'});
      years += '<option value="' + expYear + '">' + expYear + '</option>';
    }
  }

  return years;
}

function addCcMonths(cardExpMonth) {
  var months = '';
  var monthArr =  new Array(12);

  for (var i = 0; i < monthArr.length; i++) {
    var month = (i + 1),
        paddedMonth = (month < 10 ? '0' : '') + month;

    if(cardExpMonth && i === cardExpMonth){
      months += '<option value="' + month + '" selected>' + paddedMonth + '</option>';
    } else {
      months += '<option value="' + month + '">' + paddedMonth + '</option>';
    }
  }

  return months;
}

function addCcTypes(cardType) {
  var types = '';
  var typeArr = [{"value": "Visa", "label": "Visa"},
                {"value": "MasterCard", "label": "MasterCard"},
                {"value": "Discover", "label": "Discover Card"},
                {"value": "Diners Club", "label": "Diner's Club"},
                {"value": "JCB", "label": "JCB"},
                {"value": "AMEX", "label":"American Express"}];

  for (var i = 0; i < typeArr.length; i++) {
    if(cardType && typeArr[i].value === cardType){
      types += '<option value="' + typeArr[i].value + '" selected>' + typeArr[i].label + '</option>';
    } else {
      types += '<option value="' + typeArr[i].value + '">' + typeArr[i].label + '</option>';
    }
  }

  return types;
}

function addSelectedValues(creditCard) {

  creditCard.years = addCcYears(creditCard.cardExpYear);
  creditCard.months = addCcMonths(creditCard.cardExpMonth);
  creditCard.types = addCcTypes(creditCard.cardType);

  return creditCard;
}

function loadCreditCard(id) {
  teardownSecureCreditCardFields();
  var html = '';

  if (id) {

    //noinspection JSUnusedLocalSymbols
    myAccount.getCreditCard(id, {
      success: function (creditCard) {
        html = 'This card could not be loaded at this time.';
        if (creditCard) {
          creditCard = addSelectedValues(creditCard);
          html = templates.payment(creditCard);
        }

        jQuery('#payment').html(html);
        bindFields();
        setupSecureCreditCardFields();

        //This event is used so we can listen for when the handlebard templates get initialized
        jQuery(document).trigger('handlebarsInit');
      }
    });

  } else {
    var years = addCcYears();
    var months = addCcMonths();
    var types = addCcTypes();
    html = templates.payment({years: years, months: months, types: types});
    jQuery('#payment').html(html);
    bindFields();
    setupSecureCreditCardFields();
  }
}

function updatePayment(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  clearAllMessages();

  // validate the fields
  var id = jQuery.trim(jQuery('#id').val());
  var merchantId = jQuery.trim(jQuery('#merchantId').val());
  var customerProfileId = jQuery.trim(jQuery('#customerProfileId').val());

  var cardType = jQuery.trim(jQuery('#cardType').val());
  var cardExpMonth = jQuery.trim(jQuery('#cardExpMonth').val());
  var cardExpYear = jQuery.trim(jQuery('#cardExpYear').val());
  // var cardNumber = jQuery.trim(jQuery('#cardNumber').val());
  var tokenField = jQuery('#creditCardNumberToken');

  // this may not be present on fields immediately.  it will eventually.
  var creditCardNumberToken = null;
  if(tokenField && tokenField.length){
    creditCardNumberToken = jQuery.trim(tokenField.val());
  }


  if (!cardType) {
    showError("Card Type is a required field.");
    return;
  }

  if (!cardExpMonth) {
    showError("Please select the expiration month.");
    return;
  }

  if (!cardExpYear) {
    showError("Please select the expiration year.");
    return;
  }

  if (!id && !creditCardNumberToken) {
    showError("Card Number is a required field.");
    return;
  }


  var functionName = 'insertCreditCard';
  if (id) {
    functionName = 'updateCreditCard';
  }

  creditCard = {
    id: id == '' ? -1: parseInt(id),
    merchantId: merchantId,
    customerProfileId: customerProfileId == '' ? -1 : parseInt(customerProfileId),
    cardType: cardType,
    cardExpMonth: parseInt(cardExpMonth),
    cardExpYear: parseInt(cardExpYear),
    // cardNumber: cardNumber
    creditCardNumberToken: creditCardNumberToken
  };

  myAccount[functionName](creditCard, {
    success:function(creditCard){
      showSuccess("Your changes were saved.  Press back on your browser to return to your payment list.");
      // set the id so subsequent saves are updates.
      jQuery('#id').val(creditCard.id);
      jQuery('#merchantId').val(creditCard.merchantId);
      jQuery('#customerProfileId').val(creditCard.customerProfileId);

    },
    failure:function(jqXHR){
      var errorMsg = null;
      if(jqXHR && jqXHR.getResponseHeader){
        errorMsg = jqXHR.getResponseHeader('UC-REST-ERROR');
      }

      if(errorMsg){
        showError("Save failed with this error: " + errorMsg);
      } else {
        showError("Your card could not be saved at this time.  Please try again later.");
      }

    }
  });

}


function bindFields() {
  jQuery('#cancelButton').unbind().bind('click', function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    window.history.back();
  });

  jQuery('#saveButton').unbind().bind('click', updatePayment);

}


jQuery(document).ready(function () {
  enablePleaseWaitMessage();
  templates.payment = Handlebars.compile(jQuery('#payment-template').html());
  initialize();

});
