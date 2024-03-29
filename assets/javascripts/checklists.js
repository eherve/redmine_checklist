/*! jQuery klass v0.2a - Jean-Louis Grall - MIT license - http://code.google.com/p/jquery-klass-plugin */

( function( $, undefined ) {


// Function: $.klass( [SuperKlass,] props )
// Creates and returns a new class.
// Usages:  MyKlass = $.klass( { init: function() { ... } } )
//      MyKlass = $.klass( SuperKlass, { } )
// Arguments:
//    SuperKlass  (optional) The super class that the new class will extend.
//    props   Set of methods and other class properties.
// Special props names:
//    init    The constructor. If omitted, an implicit init will be created.
//          Thus all classes have an init method.
//    _klass    Set of class methods (static methods). They will be added directly to the class.
// Notes:
//  - $.klass is the implicit super class, not Object
    var $klass = $.klass = function( _super, fields ) { // The class factory. It is also the invisible "super class" of all classes. Methods added to its prototype will be available to all classes.

            // If no _super:
            if ( !fields ) {
                fields = _super;
                _super = undefined;
            }

            var
            // init is our future class and constructor
            // If no init is provided, make one (Implicit constructor)
                klass = fields.init || ( fields.init = function() {
                    // Automatically calls the superconstructor if there is one.
                    _super && _super.prototype.init.apply( this, arguments );
                } ),

            // Used to make the new klass extends its super class
                protoChainingProxy = function() { },

            // klass.prototype
                proto,

            // index in loop
                name;

            // Prepare prototype chaining to the super class
            // If no super class, use $.klass as implicit super class
            protoChainingProxy.prototype = (_super || $klass).prototype;
            // Make the [[prototype]]'s chain from klass to it's super class
            proto = klass.prototype = new protoChainingProxy; // At the end we have: klass.prototype.[[prototype]] = protoChainingProxy.prototype = _super.prototype. Here the "new" operator creates the new object with the right prototype chain, but doesn't call the constructor because there is no "()". See also: http://brokenliving.blogspot.com/2009/09/simple-javascript-inheritance.html
            // Now we have: klass.prototype.[[prototype]] = protoChainingProxy.prototype = _super.prototype

            // Accessor for super klass ( can be undefined )
            klass._super = _super;

            // Add each function to the prototype of the new class (they are our new class methods):
            for ( name in fields ) {
                // Add the static variables to the new class:
                if ( name === "_klass" ) $.extend( klass, fields[name] );
                // Each new method keeps a reference to its name and its class, allowing us to find its super method dynamically at runtime:
                else $.isFunction( proto[ name ] = fields[name] ) && ( fields[name]._klass = { klass: klass, name: name } );
            }

            // Sets the constructor for instanciated objects
            proto.constructor = klass;

            return klass;
        },
        Array_slice = [].slice;


    /* $.klass.prototype */
// Properties assigned to it are available from any instance of a class made by $.klass

// Function: this._super( [ methodName,] arguments, args... )
// Calls a super method. Finds the super method dynamically.
// Usages:  this._super( arguments, arg1, arg2, arg3, ... )
//      this._super( "methodName", arguments, arg1, arg2, arg3, ... )
// Arguments:
//    methodName  (optional) Name of the super method.
//          By default, use the name of the calling method.
//    arguments You must give the arguments object here.
//    args...   List of arguments for the super method.
// Note:
//  - Super methods are found dynamically by the function in the super class using the method's name.
    $klass.prototype._super = function( arg0, arg1 ) {
        var arg0IsArguments = arg0.callee,
            _klass = ( arg0IsArguments ? arg0 : arg1 ).callee._klass,
            name = arg0IsArguments ? _klass.name : arg0,
            superMethod = _klass.klass._super.prototype[ name ];
        return superMethod.apply( this, Array_slice.call( arguments, 1 + ( !arg0IsArguments ) ) );
    };

})( jQuery );

var Redmine = Redmine || {};

Redmine.Checklist = $.klass({

  preventEvent: function(event) {
    if (event.preventDefault)
      event.preventDefault()
    else
      event.returnValue = false
  },

  addChecklistFields: function() {
    var new_id = new Date().getTime();
    var regexp = new RegExp("new_checklist", "g");
    appended = $(this.content.replace(regexp, new_id)).appendTo(this.root)
    appended.find('.edit-box-subject').focus()
  },

  findSpan: function(event) {
    return $(event.target).closest('.checklist-item')
  },

  transformItem: function(event) {
    checklistItem = this.findSpan(event)
    val = checklistItem.find('input.edit-box-subject').val()
    checklistItem.find('.checklist-subject').text(val)
    checklistItem.find('.checklist-subject-hidden').val(val)
    val = checklistItem.find('input.edit-box-ratio').val()
    if (val != null && val != '') { checklistItem.find('.checklist-ratio').text(" - " + val + "%"); }
    checklistItem.find('.checklist-ratio-hidden').val(val)
    checklistItem.removeClass('edit')
    checklistItem.removeClass('new')
    checklistItem.addClass('show')
  },

  resetItem: function(item) {
    item.find('input.edit-box-subject').val(item.find('checklist-subject-hidden').val() )
    item.find('input.edit-box-ratio').val(item.find('checklist-ratio-hidden').val() )
    item.removeClass('edit')
    item.addClass('show')
  },

  addChecklistItem: function(event) {
    this.preventEvent(event)
    this.transformItem(event)
    this.addChecklistFields()
  },

  canSave: function(span) {
    var ratio = span.find('input.edit-box-ratio').val();
    var ratioValid = ratio == null || ratio == '' ||
      (!isNaN(ratio = parseInt(ratio)) && ratio >= 0 && ratio <= 100 );
    return (!span.hasClass('invalid')) && (span.find('input.edit-box-subject').val().length > 0) &&
      ratioValid
  },

  onEnterInNewChecklistItemForm: function() {
    this.root.on('keydown', 'input.edit-box-subject, input.edit-box-ratio', $.proxy(function(event) {
      if (event.which == 13) {
        this.preventEvent(event)
        span = this.findSpan(event)
        if (this.canSave(span))
        {
          if (span.hasClass('edit'))
            this.transformItem(event)
          else
            this.addChecklistItem(event)
        }
      }
    }, this))
  },

  onClickPlusInNewChecklistItem: function() {
    this.root.on('click', '.save-new-by-button', $.proxy(function(event){
      span = this.findSpan(event)
      if (this.canSave(span))
        this.addChecklistItem(event)
    }, this))
  },

  onIssueFormSubmitRemoveEmptyChecklistItems: function() {
    $('#issue-form').on('submit', function(){
      $('.checklist-subject-hidden').each(function(i, elem) {
        if ($(elem).val() == "")
        {
          $(elem).closest('.checklist-item').remove()
        }
      })
    })
  },

  onChecklistRemove: function() {
    this.root.on('click', '.checklist-remove a', $.proxy(function(event){
      this.preventEvent(event)
      removed = this.findSpan(event)
      removed.find('.checklist-remove input[type=hidden]').val('1')
      removed.fadeOut(200)
    }, this))
  },

  makeChecklistsSortable: function() {
    $('#checklist_form_items').sortable({
      revert: true,
      items: '.checklist-item.show',
      helper: "clone",
      stop: function (event, ui) {
        if (ui.item.hasClass("edited-now")) {
          $( this ).sortable( "cancel" );
        }
        if (ui.item.hasClass("edit-active")) {
          $( this ).sortable( "cancel" );
        }
        $(".checklist-item").each(function(index, element){
          $(element).children('.checklist-item-position').val(index);
        });
      }
    });
  },

  makeChecklistsEditable: function() {
    this.root.on('click', '.checklist-subject', $.proxy(function(event) {
      $('.checklist-item').each($.proxy(function(i, elem) {
        if ($(elem).hasClass('edit'))
          this.resetItem($(elem))
      }, this))

      span = this.findSpan(event)
      span.addClass('edit')
      span.removeClass('show')
      span.find('.edit-box-subject').val(span.find('.checklist-subject-hidden').val())
      span.find('.edit-box-ratio').val(span.find('.checklist-ratio-hidden').val())
      span.find('.edit-box-subject').focus()
    }, this));
    this.root.on('click', '.checklist-edit-save-button', $.proxy(function(event){
      this.transformItem(event)
    }, this))
    this.root.on('click', '.checklist-edit-reset-button', $.proxy(function(event){
      this.resetItem(this.findSpan(event))
    }, this))
  },

  onCheckboxChanged: function() {
    this.root.on('change', 'input[type=checkbox]', $.proxy(function(event){
      checkbox = $(event.target)
      subj = this.findSpan(event).find('.checklist-subject')
      if (checkbox.is(':checked'))
        subj.addClass('is-done-checklist-item')
      else
        subj.removeClass('is-done-checklist-item')
    }, this))
  },

  onChangeCheckbox: function(){
    this.root.on('change', 'input.checklist-checkbox', $.proxy(function(event){
      checkbox = $(event.target)
      url = checkbox.attr('data_url')
      $.ajax({type: "PUT", url: url, dataType: 'script'})
    }, this))
  },

  enableUniquenessValidation: function() {
    this.root.on('keyup', 'input.edit-box-subject', $.proxy(function(event) {
      value = $(event.target).val()
      span = this.findSpan(event)
      span.removeClass('invalid')
      $('.checklist-item').each(function(i, elem) {
        e = $(elem)
        if (!e.is('.edit') && !e.is('.new'))
        {
          if ( (value == e.find('.edit-box-subject').val()) )
          {
            span.addClass('invalid')
          }
        }
      })
    }, this))
  },

  enableRatioValidation: function() {
    this.root.on('keyup', 'input.edit-box-ratio', $.proxy(function(event) {
      var ratio = $(event.target).val()
      span = this.findSpan(event)
      span.removeClass('invalid')
      if (ratio == null || ratio == '') { return; }
      if (isNaN(ratio = parseInt(ratio)) || ratio < 0 || ratio > 100) {
        span.addClass('invalid')
        return;
      }
    }, this))
  },

  init: function(element) {
    this.root = element
    this.content = element.data('checklist-fields')
    this.onEnterInNewChecklistItemForm()
    this.onClickPlusInNewChecklistItem()
    this.onIssueFormSubmitRemoveEmptyChecklistItems()
    this.onChecklistRemove()
    this.makeChecklistsSortable()
    this.makeChecklistsEditable()
    this.onCheckboxChanged()
    this.onChangeCheckbox()
    this.enableUniquenessValidation()
    this.enableRatioValidation()
  }

})

$.fn.checklist = function(element){
  new Redmine.Checklist(this);
}

$(function(){
  $('span#checklist_form_items').checklist()
  $('#checklist_items').checklist()
})
