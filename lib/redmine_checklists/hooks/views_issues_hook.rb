# This file is a part of Redmine Checklists (redmine_checklists) plugin,
# issue checklists management plugin for Redmine
#
# Copyright (C) 2011-2014 Kirill Bezrukov
# http://www.redminecrm.com/
#
# redmine_checklists is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# redmine_checklists is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with redmine_checklists.  If not, see <http://www.gnu.org/licenses/>.

module RedmineChecklists
  module Hooks
    class ViewsIssuesHook < Redmine::Hook::ViewListener
      #render_on :view_issues_show_description_bottom, :partial => "issues/checklist"
      def view_issues_show_description_bottom(context={ })
        checklist_specified_ratio = 0
        context[:issue].checklists.each {
          |c|
          if c.ratio != nil then checklist_specified_ratio += c.ratio end
        }
        context[:checklist_specified_ratio] = checklist_specified_ratio
        context[:controller].send(:render_to_string, {
          :partial => "issues/checklist",
          :locals => context
        })
      end

      render_on :view_issues_form_details_bottom, :partial => "issues/checklist_form"
    end
  end
end
