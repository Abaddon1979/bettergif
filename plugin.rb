# name: bettergif
# about: A GIF picker for Discourse chat and composer using the KLIPY API (with per-user monetization)
# version: 2.0
# authors: Abaddon
# url: https://github.com/your-repo/chatgif

# frozen_string_literal: true

register_asset "stylesheets/chatgif.scss"

register_svg_icon "film"

enabled_site_setting :chatgif_enabled

after_initialize do
  module ::Chatgif
    PLUGIN_NAME = "bettergif"
    KLIPY_BASE = "https://api.klipy.com/api/v1"

    class KlipyController < ::ApplicationController
      requires_plugin PLUGIN_NAME
      requires_login

      skip_before_action :check_xhr
      before_action :ensure_enabled
      before_action :ensure_api_key

      PAGE_SIZE = 24
      MAX_QUERY_LENGTH = 100

      def search
        query = params[:q].to_s.strip
        if query.blank? || query.length > MAX_QUERY_LENGTH
          return render json: { error: "Invalid search query" }, status: 400
        end

        proxy_klipy("gifs/search", list_query_params.merge("q" => query))
      end

      def trending
        proxy_klipy("gifs/trending", list_query_params)
      end

      def recent
        proxy_klipy(
          "gifs/recent/#{klipy_customer_id}",
          list_query_params.except("customer_id"),
        )
      end

      def share
        slug = params.require(:slug).to_s
        raise Discourse::InvalidParameters.new(:slug) if slug.blank? || slug.length > 200

        body = { "customer_id" => klipy_customer_id }
        body["q"] = params[:q].to_s if params[:q].present?

        response =
          Excon.post(
            "#{KLIPY_BASE}/#{api_key}/gifs/share/#{CGI.escape(slug)}",
            headers: {
              "Accept" => "application/json",
              "Content-Type" => "application/json",
              "User-Agent" => request.user_agent.to_s.presence || "Discourse-ChatGIF",
            },
            body: body.to_json,
            connect_timeout: 5,
            read_timeout: 5,
          )

        render plain: redact_api_key(response.body.to_s),
               status: response.status,
               content_type: "application/json"
      rescue Excon::Error => e
        render json: { error: e.message }, status: 502
      end

      private

      def ensure_enabled
        raise Discourse::NotFound if !SiteSetting.chatgif_enabled
      end

      def ensure_api_key
        head :forbidden if api_key.blank?
      end

      def api_key
        SiteSetting.chatgif_klipy_api_key.to_s.strip
      end

      # Stable anonymous id for KLIPY personalization + ad monetization.
      # Hashed so sequential Discourse user ids are not exposed to KLIPY.
      def klipy_customer_id
        digest =
          Digest::SHA256.hexdigest(
            "#{Rails.application.secret_key_base}:chatgif:#{current_user.id}",
          )
        "usr_#{digest[0, 16]}"
      end

      def list_query_params
        page = (params[:page].presence || 1).to_i
        page = 1 if page < 1
        per_page = (params[:per_page].presence || PAGE_SIZE).to_i
        per_page = PAGE_SIZE if per_page < 8 || per_page > 50

        {
          "page" => page,
          "per_page" => per_page,
          "customer_id" => klipy_customer_id,
          "locale" => SiteSetting.chatgif_klipy_locale.presence || "en_US",
          "content_filter" => SiteSetting.chatgif_klipy_content_filter.presence || "high",
          "ad-iframe" => "1",
          "ad-min-width" => SiteSetting.chatgif_klipy_ad_min_width,
          "ad-max-width" => SiteSetting.chatgif_klipy_ad_max_width,
          "ad-min-height" => SiteSetting.chatgif_klipy_ad_min_height,
          "ad-max-height" => SiteSetting.chatgif_klipy_ad_max_height,
        }
      end

      def proxy_klipy(path, query)
        response =
          Excon.get(
            "#{KLIPY_BASE}/#{api_key}/#{path}",
            headers: {
              "Accept" => "application/json",
              "User-Agent" => request.user_agent.to_s.presence || "Discourse-ChatGIF",
            },
            query: query,
            connect_timeout: 5,
            read_timeout: 5,
          )

        render plain: redact_api_key(response.body.to_s),
               status: response.status,
               content_type: "application/json"
      rescue Excon::Error => e
        render json: { error: e.message }, status: 502
      end

      def redact_api_key(body)
        return body if api_key.blank?

        [api_key, CGI.escape(api_key)].uniq.reduce(body) do |redacted, value|
          redacted.gsub(value, "[FILTERED]")
        end
      end
    end
  end

  Discourse::Application.routes.append do
    get "/chatgif/search" => "chatgif/klipy#search", defaults: { format: :json }
    get "/chatgif/trending" => "chatgif/klipy#trending", defaults: { format: :json }
    get "/chatgif/recent" => "chatgif/klipy#recent", defaults: { format: :json }
    post "/chatgif/share" => "chatgif/klipy#share", defaults: { format: :json }
  end
end
