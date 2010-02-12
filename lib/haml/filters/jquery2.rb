module Haml::Filters::Jquery2
  include Haml::Filters::Base

  def render_with_options(text, options)
    <<END
<script type="text/jquery">
#{text}
</script>
END
  end
end
