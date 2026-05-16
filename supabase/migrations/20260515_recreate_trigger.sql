
CREATE TRIGGER on_appointment_change_update_enhanced
    AFTER INSERT OR UPDATE ON appointments_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_details();
