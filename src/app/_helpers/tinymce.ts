declare const tinymce: any;

export function initTinyMCE() {
    tinymce.remove();
    tinymce.init({
      selector: 'textarea',
      plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak paste',
      toolbar: 'styleselect bold italic backcolor alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
      toolbar_mode: 'floating'
   });
}