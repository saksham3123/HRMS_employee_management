/*------------------------------------------------------------------
[Create Project page Js - Optimized]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/

(function (window, document, $) {
    'use strict';

    const DashQ = window.DashQ || {};

    DashQ.Project = {
        init: function () {
            if (this._initialized) return;
            this._initialized = true;

            this.initEditor();
            this.initSelect2();
            this.initFileUploads();
        },

        // --- Rich Text Editor ---
        initEditor: function () {
            const el = document.querySelector("#create_project_detail");
            if (el && typeof Quill !== 'undefined') {
                new Quill(el, {
                    theme: "snow",
                    placeholder: 'Enter project milestones, objectives, and technical requirements...',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, false] }],
                            ['bold', 'italic', 'underline'],
                            ['link', 'blockquote', 'code-block'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }]
                        ]
                    }
                });
            }
        },

        // --- Select2 ---
        initSelect2: function () {
            const $field = $('#multiple-select-optgroup-field');

            if (
                $field.length &&
                $.fn.select2 &&
                !$field.hasClass("select2-hidden-accessible")
            ) {
                $field.select2({
                    theme: "bootstrap-5",
                    width: '100%',
                    placeholder: $field.data('placeholder') || "Assign team members...",
                    closeOnSelect: false,
                    allowClear: true,
                    selectionCssClass: 'select2--small',
                    dropdownCssClass: 'select2--small',
                });
            }
        },

        // --- Dropify ---
        initFileUploads: function () {
            const $dropify = $('.dropify');

            if (
                $dropify.length &&
                $.fn.dropify &&
                !$dropify.data('dropify')
            ) {
                $dropify.dropify({
                    messages: {
                        default: 'Drag and drop project files or click',
                        replace: 'Drag and drop or click to replace',
                        remove: 'Remove',
                        error: 'Ooops, something wrong happened.'
                    },
                    tpl: {
                        message: '<div class="dropify-message"><span class="bi bi-cloud-arrow-up fs-1 text-primary"></span> <p>{{ default }}</p></div>'
                    }
                });
            }
        }
    };

    // Init
    $(function () {
        DashQ.Project.init();
    });

    window.DashQ = DashQ;

})(window, document, jQuery);